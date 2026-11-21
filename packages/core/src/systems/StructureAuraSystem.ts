import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type {
  StructureAuraCadence,
  StructureAuraDefinition,
  StructureDefinition,
} from '../content/structures/structures.types';
import { Structure } from '../entities/structures/Structure';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/** One living aura emitter: who it is, its side and aura, and where it stands. */
type AuraSource = {
  readonly id: EntityId;
  readonly team: 'light' | 'dark';
  readonly aura: StructureAuraDefinition;
  readonly x: number;
  readonly y: number;
};

/** The units that hold each aura status, by status id. */
type Holders = Map<string, Set<EntityId>>;

/**
 * Structure auras (DEC-315 (4), architecture 07 §1, 05 §8): every `cadence.everyTicks`, each
 * living structure whose definition has an `aura` gives its ally status to the units of its own
 * team within the radius and its enemy status to the units of the other playable team. Neutral
 * units (camp mobs, bosses) are neither and get nothing. A unit that had a status on the last
 * pass and does not now (it left, or the tower fell) loses it at once through the applier's
 * `remove` ("loses it on leaving", FR-029); the status's short duration is the backstop. Runs after
 * `VeterancySystem`. It reads the neighbour index and does nothing without one.
 */
export class StructureAuraSystem implements System {
  public readonly name = 'structure-aura';
  private found = new Int32Array(0);
  /** Who the last pass gave each status to. */
  private held: Holders = new Map();

  /**
   * @param statuses - The match's one status applier.
   * @param definitions - Where each structure's definition, and so its aura, is looked up.
   * @param cadence - How often the aura is refreshed (content, loaded in ticks).
   */
  public constructor(
    private readonly statuses: StatusEffectApplier,
    private readonly definitions: Pick<ContentCatalogue<StructureDefinition>, 'get'>,
    private readonly cadence: StructureAuraCadence,
  ) {}

  /** Refreshes every aura on the cadence, then ends the statuses of units that are out now. */
  public update({ state }: SystemContext): void {
    const space = state.space;
    if (space === null || state.tick % this.cadence.everyTicks !== 0) {
      return;
    }
    // Room for every indexed unit, as `VeterancySystem` sizes its buffer: a query never drops one.
    if (this.found.length < space.count) {
      this.found = new Int32Array(Math.max(space.count, 2 * this.found.length));
    }
    const now: Holders = new Map();
    state.entities.forEach((entity) => {
      if (!(entity instanceof Structure)) {
        return;
      }
      const aura = this.definitions.get(entity.definitionId).aura;
      const index = space.indexOf(entity.id);
      const team = state.entities.teamOf(entity.id);
      if (
        aura === undefined ||
        index === undefined ||
        (team !== 'light' && team !== 'dark') ||
        !state.entities.isAlive(entity.id)
      ) {
        return;
      }
      const x = space.positions[2 * index] ?? 0;
      const y = space.positions[2 * index + 1] ?? 0;
      this.spread(state, { id: entity.id, team, aura, x, y }, now);
    });
    this.endLeft(state, now);
    this.held = now;
  }

  /** Ends each status the last pass gave to a unit that this pass did not. */
  private endLeft(state: GameState, now: Holders): void {
    for (const [statusId, ids] of this.held) {
      for (const id of ids) {
        if (now.get(statusId)?.has(id) !== true) {
          this.statuses.remove(state, id, statusId);
        }
      }
    }
  }

  private spread(state: GameState, source: AuraSource, now: Holders): void {
    const space = state.space;
    if (space === null) {
      return;
    }
    const { aura } = source;
    const count = space.queryCircle(source.x, source.y, aura.radius, this.found);
    for (let at = 0; at < count; at += 1) {
      const id = space.idAt(this.found[at] ?? 0);
      const team = state.entities.teamOf(id);
      if (id === source.id || (team !== 'light' && team !== 'dark')) {
        continue;
      }
      const statusId = team === source.team ? aura.allyStatusId : aura.enemyStatusId;
      if (this.statuses.apply(state, id, statusId, source.id)) {
        const ids = now.get(statusId) ?? new Set<EntityId>();
        ids.add(id);
        now.set(statusId, ids);
      }
    }
  }
}
