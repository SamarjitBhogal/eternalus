import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { isBreakableUnder } from '../content/structures/breakability';
import type { BreakabilityFacts, BreakabilityRule } from '../content/structures/breakability.types';
import type { StructureDefinition } from '../content/structures/structures.types';
import { Structure } from '../entities/structures/Structure';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { GameState } from '../state/GameState';
import type { PlayableTeam } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

/** The kind whose losses open walls and gates (07 §3). */
const BUFF_TOWER_KIND = 'buff-tower';

/**
 * Keeps the structures' lifecycle (architecture 07 §3, §8, §11): announces each structure that
 * died this tick with `structure-destroyed` (its kind, team and lane), and re-evaluates every structure's `BreakabilityRule`, flipping
 * `Collider.isUnbreakable` and emitting `structure-breakability-changed` when it changes. Runs
 * after every system that deals damage and before `DeathSystem`, so the dead are still in the
 * store when they are announced. Never calls another system: the effects of a loss are listeners.
 */
export class StructureSystem implements System {
  public readonly name = 'structure';

  /** @param definitions - Where each structure's definition, and so its rule, is looked up. */
  public constructor(
    private readonly definitions: Pick<ContentCatalogue<StructureDefinition>, 'get'>,
  ) {}

  /** Announces this tick's destroyed structures, then updates breakability, in store order. */
  public update({ state }: SystemContext): void {
    const living: Structure[] = [];
    state.entities.forEach((entity) => {
      if (!(entity instanceof Structure)) {
        return;
      }
      if (entity.findComponent(Health)?.isDead === true) {
        state.events.emit('structure-destroyed', {
          entityId: entity.id,
          kind: entity.kind,
          team: state.entities.teamOf(entity.id) ?? 'neutral',
          lane: entity.laneId,
        });
        return;
      }
      living.push(entity);
    });
    const { numLanes, buffTowersPerLane } = state.config.map;
    const total = numLanes * buffTowersPerLane;
    const lostByTeam = new Map<PlayableTeam, number>();
    for (const structure of living) {
      const team = state.entities.teamOf(structure.id) ?? 'neutral';
      let lost = 0;
      if (team === 'light' || team === 'dark') {
        lost =
          lostByTeam.get(team) ??
          state.laneStructures.lostCount(team, BUFF_TOWER_KIND, state.entities);
        lostByTeam.set(team, lost);
      }
      this.updateBreakability(state, structure, { lost, total });
    }
  }

  private updateBreakability(
    state: GameState,
    structure: Structure,
    facts: BreakabilityFacts,
  ): void {
    const collider = structure.findComponent(Collider);
    if (collider === undefined) {
      return;
    }
    const { breakability } = this.definitions.get(structure.definitionId);
    const isBreakable = isBreakableUnder(breakability, facts);
    if (collider.isUnbreakable === !isBreakable) {
      return;
    }
    collider.setUnbreakable(!isBreakable);
    state.events.emit('structure-breakability-changed', {
      entityId: structure.id,
      isBreakable,
      lane: structure.laneId,
    });
  }

  /**
   * Whether `rule` lets a structure take damage with `down` of its team's `total` BuffTowers lost
   * (`total` from config: `numLanes × buffTowersPerLane`, 07 §3). Pure, so an invariant can
   * re-evaluate it from scratch.
   */
  public static passes(rule: BreakabilityRule, down: number, total: number): boolean {
    return isBreakableUnder(rule, { lost: down, total });
  }
}
