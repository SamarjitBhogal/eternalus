import { Aura } from '../components/Aura';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type {
  StructureAuraCadence,
  StructureDefinition,
} from '../content/structures/structures.types';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { isPlayableTeam } from '../teams/playableTeams';
import type { System, SystemContext } from './System.types';
import type { AuraSource } from './StructureAuraSystem.types';

/**
 * Structure auras (DEC-315 (4), architecture 07 §1, 05 §8): every `cadence.everyTicks`, each
 * living entity with an `Aura` gives its ally status to the units of its own team within the
 * radius and its enemy status to the units of the other playable team. Neutral units (camp mobs,
 * bosses) are neither and get nothing. A unit that holds an aura status that no living source
 * covers now (it left, or the source fell) loses it at once through the applier's `remove`
 * ("loses it on leaving", FR-029); the status's short duration is the backstop. Stateless: who is
 * covered comes from the positions on each pass, unit by unit in store order (03 §8), so it holds
 * after a state restore. Runs after `VeterancySystem`.
 */
export class StructureAuraSystem implements System {
  public readonly name = 'structure-aura';
  /** Every status an aura gives, so one left behind by a source that is gone is found. */
  private readonly auraStatusIds: ReadonlySet<string>;

  /**
   * @param statuses - The match's one status applier.
   * @param structures - The structure definitions, read once for the statuses their auras give.
   * @param cadence - How often the auras are refreshed (content, loaded in ticks).
   */
  public constructor(
    private readonly statuses: StatusEffectApplier,
    structures: Pick<ContentCatalogue<StructureDefinition>, 'all'>,
    private readonly cadence: StructureAuraCadence,
  ) {
    this.auraStatusIds = new Set(
      structures
        .all()
        .flatMap(({ aura }) => (aura === undefined ? [] : [aura.allyStatusId, aura.enemyStatusId])),
    );
  }

  /** On the cadence, ends the aura statuses no source covers now, then refreshes the rest. */
  public update({ state }: SystemContext): void {
    if (state.tick % this.cadence.everyTicks !== 0) {
      return;
    }
    const sources = StructureAuraSystem.sourcesOf(state);
    // ponytail: every unit against every source; few sources (one BuffTower per lane and team).
    // Query `state.space` per source if auras multiply.
    state.entities.forEach((unit) => {
      const statuses = unit.findComponent(StatusEffects);
      const position = unit.findComponent(Transform)?.position;
      if (statuses === undefined || position === undefined) {
        return;
      }
      const team = state.entities.teamOf(unit.id);
      const covering = sources.map((source) => ({
        sourceId: source.id,
        statusId: StructureAuraSystem.statusFrom(source, unit, team, position.x, position.y),
      }));
      // Backwards: `remove` splices `active`.
      for (let at = statuses.active.length - 1; at >= 0; at -= 1) {
        const statusId = statuses.active[at]?.definition.id ?? '';
        if (
          this.auraStatusIds.has(statusId) &&
          !covering.some((cover) => cover.statusId === statusId)
        ) {
          this.statuses.remove(state, unit.id, statusId);
        }
      }
      for (const { sourceId, statusId } of covering) {
        if (statusId !== null) {
          this.statuses.apply(state, unit.id, statusId, sourceId);
        }
      }
    });
  }

  /** The status `source` gives `unit` (of `team`, at `x`, `y`), or null when it gives none. */
  private static statusFrom(
    source: AuraSource,
    unit: Entity,
    team: Team | undefined,
    x: number,
    y: number,
  ): string | null {
    const { aura } = source;
    if (unit.id === source.id || !isPlayableTeam(team)) {
      return null;
    }
    const dx = x - source.x;
    const dy = y - source.y;
    if (dx * dx + dy * dy > aura.radius * aura.radius) {
      return null;
    }
    return team === source.team ? aura.allyStatusId : aura.enemyStatusId;
  }

  /** The living aura sources of a playable team, in store order, read from their `Transform`. */
  private static sourcesOf(state: GameState): readonly AuraSource[] {
    const sources: AuraSource[] = [];
    state.entities.forEach((entity) => {
      const aura = entity.findComponent(Aura);
      const position = entity.findComponent(Transform)?.position;
      const team = state.entities.teamOf(entity.id);
      if (
        aura !== undefined &&
        position !== undefined &&
        isPlayableTeam(team) &&
        state.entities.isAlive(entity.id)
      ) {
        sources.push({ id: entity.id, team, aura: aura.definition, x: position.x, y: position.y });
      }
    });
    return sources;
  }
}
