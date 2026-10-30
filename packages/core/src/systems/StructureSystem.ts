import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import type { BreakabilityRule } from '../content/structures/breakability.types';
import type { StructureDefinition } from '../content/structures/structures.types';
import { BuffTower } from '../entities/structures/BuffTower';
import { Structure } from '../entities/structures/Structure';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { System, SystemContext } from './System.types';

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
    const buffTowersAlive = new Map<Team, number>();
    state.entities.forEach((entity) => {
      if (!(entity instanceof Structure)) {
        return;
      }
      const team = state.entities.teamOf(entity.id) ?? 'neutral';
      if (entity.findComponent(Health)?.isDead === true) {
        state.events.emit('structure-destroyed', {
          entityId: entity.id,
          kind: entity.kind,
          team,
          lane: entity.laneId,
        });
        return;
      }
      living.push(entity);
      if (entity instanceof BuffTower) {
        buffTowersAlive.set(team, (buffTowersAlive.get(team) ?? 0) + 1);
      }
    });
    const { numLanes, buffTowersPerLane } = state.config.map;
    const total = numLanes * buffTowersPerLane;
    for (const structure of living) {
      const team = state.entities.teamOf(structure.id) ?? 'neutral';
      const down = Math.max(0, total - (buffTowersAlive.get(team) ?? 0));
      this.updateBreakability(state, structure, down, total);
    }
  }

  private updateBreakability(
    state: GameState,
    structure: Structure,
    down: number,
    total: number,
  ): void {
    const collider = structure.findComponent(Collider);
    if (collider === undefined) {
      return;
    }
    const { breakability } = this.definitions.get(structure.definitionId);
    const isBreakable = StructureSystem.passes(breakability, down, total);
    if (collider.isUnbreakable !== isBreakable) {
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
    if (rule.kind === 'allied-buff-towers-down') {
      return down >= Math.ceil(rule.fraction * total);
    }
    return rule.kind === 'always';
  }
}
