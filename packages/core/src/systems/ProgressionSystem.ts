import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import type { XpSourcesDefinition } from '../content/progression/progression.types';
import { XP_SOURCES } from '../content/progression/xpSources';
import type { Entity } from '../entities/Entity';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';

/** One kill waiting for this system's pass. */
type Award = { readonly killerId: EntityId; readonly xp: number };

/**
 * Turns kills into XP and levels (architecture 05 §13). It listens to `entity-died`, prices the kill
 * while the victim is still in the store, and in its own pass gives the XP to the killer's
 * `Progression`. Each level gained raises max health and max aether by the class's scaling and
 * emits `level-up`.
 */
export class ProgressionSystem implements System {
  public readonly name = 'progression';

  private readonly pending: Award[] = [];

  /**
   * @param state - The match whose `entity-died` events this system listens to.
   * @param xpSources - What each kill is worth.
   */
  public constructor(
    state: GameState,
    private readonly xpSources: XpSourcesDefinition = XP_SOURCES,
  ) {
    state.events.on('entity-died', ({ entityId, killer }) => {
      const victim = state.entities.get(entityId);
      if (killer.attackerId !== null && victim !== undefined) {
        this.pending.push({ killerId: killer.attackerId, xp: this.xpFor(victim) });
      }
    });
  }

  /** Gives this tick's kill XP, in kill order, and applies each level gained. */
  public update({ state }: SystemContext): void {
    for (const { killerId, xp } of this.pending.splice(0)) {
      const killer = state.entities.get(killerId);
      const progression = killer?.findComponent(Progression);
      if (killer === undefined || progression === undefined) {
        continue;
      }
      const gained = progression.addXp(xp);
      for (let step = gained - 1; step >= 0; step -= 1) {
        ProgressionSystem.levelUp(killer, progression);
        state.events.emit('level-up', { entityId: killer.id, level: progression.level - step });
      }
    }
  }

  private xpFor(victim: Entity): number {
    const level = victim.findComponent(Progression)?.level;
    if (level !== undefined) {
      return this.xpSources.legendKill.base + this.xpSources.legendKill.perVictimLevel * level;
    }
    return this.xpSources.mobKill[victim.kind] ?? 0;
  }

  private static levelUp(entity: Entity, progression: Progression): void {
    const health = entity.findComponent(Health);
    health?.raiseMax(health.baseMax * progression.scaling.healthPerLevel);
    entity.findComponent(Aether)?.raiseMax(progression.scaling.aetherPerLevel);
  }
}
