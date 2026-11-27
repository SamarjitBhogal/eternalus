import { BossPhase } from '../components/BossPhase';
import { ThreatLedger } from '../components/ThreatLedger';
import type { BossProfileDefinition } from '../content/ai/ai.types';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import { TickRate } from '../utils/TickRate';
import type { System, SystemContext } from './System.types';

/**
 * What a boss remembers of the damage it takes (architecture 11 §4.6, DEC-371 E7, DEC-417). Each
 * hit on a boss (`damage-applied`) marks its `BossPhase` at once, whatever the attacker. A hit with
 * an attacker also goes into its `ThreatLedger`, and hits older than its profile's
 * `brain.threatSeconds` fall out: `BossController` reads who hurts it most. Once per tick, a
 * living `healthy` boss below its profile's `hurtPhase.healthShare` turns `hurt` and
 * `boss-phase-changed` announces it, which opens its locked moves. Only a hit since the last phase
 * change counts, so a boss the developer menu set back to `healthy` turns `hurt` again on its next
 * hit, not at once. Runs after every system that deals damage and before `DeathSystem`.
 */
export class BossDamageSystem implements System {
  public readonly name = 'boss-damage';

  /**
   * @param state - The match whose `damage-applied` events this system listens to.
   * @param profiles - Every boss profile by id (`content/ai/bosses/`).
   */
  public constructor(
    state: GameState,
    private readonly profiles: Readonly<Record<string, BossProfileDefinition>>,
  ) {
    const rate = new TickRate(state.config.tickRate);
    state.events.on('damage-applied', ({ targetId, amount, absorbed, source }) => {
      const boss = state.entities.get(targetId);
      const profile = boss === undefined ? undefined : this.profileOf(state, boss);
      if (boss === undefined || profile === undefined) return;
      BossDamageSystem.ensure(boss, BossPhase).recordHit(state.tick);
      if (source.attackerId === null) return;
      const sinceTick = state.tick - rate.toTicks(profile.brain.threatSeconds);
      BossDamageSystem.ensure(boss, ThreatLedger).record(
        source.attackerId,
        amount + absorbed,
        state.tick,
        sinceTick,
      );
    });
  }

  /** Turns each living, hit, `healthy` boss below its share `hurt`, in store order. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((boss) => {
      const phase = boss.findComponent(BossPhase);
      const profile = phase === undefined ? undefined : this.profileOf(state, boss);
      if (
        phase === undefined ||
        profile === undefined ||
        phase.phase !== 'healthy' ||
        !phase.wasHitSinceChange ||
        !state.entities.isAlive(boss.id) ||
        (state.entities.healthFractionOf(boss.id) ?? 1) >= profile.hurtPhase.healthShare
      ) {
        return;
      }
      state.entities.setBossPhase(boss.id, 'hurt', state.tick);
      state.events.emit('boss-phase-changed', { bossId: boss.id, from: 'healthy', to: 'hurt' });
    });
  }

  /** The profile of a boss on `BossController`, or `undefined` for every other entity. */
  private profileOf(state: GameState, entity: Entity): BossProfileDefinition | undefined {
    const binding = state.entities.controllerOf(entity.id);
    return binding?.controllerId === 'boss' ? this.profiles[binding.profileId] : undefined;
  }

  /** The boss's component of `type`, added on first use (`BossPhase` starts `healthy`). */
  private static ensure<T extends object>(boss: Entity, type: new () => T): T {
    let component = boss.findComponent(type);
    if (component === undefined) {
      component = new type();
      boss.addComponent(component);
    }
    return component;
  }
}
