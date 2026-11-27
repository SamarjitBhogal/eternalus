import { Health } from '../components/Health';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamageSource } from '../state/GameEvents.types';
import type { DamageResult } from './DamagePipeline.types';
import type { DamageStep } from './DamageStep.types';
import { createDefaultDamageSteps } from './defaultDamageSteps';
import type { KillCredit } from './KillCredit';

/**
 * The one way damage reaches `Health` (architecture 05 §9). Anything with `Health` can be hit the
 * same way: Legends, mobs, bosses, structures and destructible obstacles such as trees. An entity
 * without `Health` (an indestructible obstacle) is never damaged.
 *
 * Emits `damage-applied` for every hit that lands, `damage-blocked` for one a step takes to 0, and
 * `entity-died` with the killer for the hit that takes health to 0; `DeathSystem` removes the dead
 * later in the tick. With a `KillCredit`, a death by the Cathedral gem names the victim's last
 * enemy damager as its killer (DEC-346).
 *
 * Every rule that changes a hit (friendly fire, statuses, structure multipliers, breakability) is a
 * `DamageStep`, run in order before `Health`; add one in `defaultDamageSteps.ts`.
 */
export class DamagePipeline {
  /**
   * @param steps - The rules each hit runs through, in order.
   * @param credit - Who a death by the gem counts for; without it every killer is the hit's source.
   */
  public constructor(
    private readonly steps: readonly DamageStep[] = createDefaultDamageSteps(),
    private readonly credit?: KillCredit,
  ) {}

  /** Deals `amount` (finite, ≥ 0) damage from `source` to `targetId`. */
  public apply(
    state: GameState,
    targetId: EntityId,
    amount: number,
    source: DamageSource,
  ): DamageResult {
    const target = state.entities.get(targetId);
    if (target === undefined) {
      return { applied: false, reason: 'no-target' };
    }

    const health = target.findComponent(Health);
    if (health === undefined) {
      return { applied: false, reason: 'no-health' };
    }
    if (health.isDead) {
      return { applied: false, reason: 'already-dead' };
    }

    if (amount === 0) {
      return { applied: false, reason: 'zero-damage' };
    }
    const final = this.afterSteps(state, targetId, amount, source);
    if (final === 0) {
      state.events.emit('damage-blocked', { targetId, source });
      return { applied: false, reason: 'blocked' };
    }

    return this.land(state, targetId, health, final, source);
  }

  /**
   * Kills `targetId` outright (an ability's `execute` step, DEC-204): it takes the target's health
   * and every shield bar. The damage steps run on that amount only to find a full block (an
   * unbreakable structure, a body that takes no damage, a teammate): then nothing happens. A step
   * that only reduces the hit does not count, so nothing reduces an execute (not `damageTaken`,
   * not a shield). It is announced as a killing hit from `source` (`damage-applied`, then
   * `entity-died`), so the kill, the XP, the assists and the ultimate meter follow as for any kill.
   */
  public execute(state: GameState, targetId: EntityId, source: DamageSource): DamageResult {
    const target = state.entities.get(targetId);
    if (target === undefined) {
      return { applied: false, reason: 'no-target' };
    }
    const health = target.findComponent(Health);
    if (health === undefined) {
      return { applied: false, reason: 'no-health' };
    }
    if (health.isDead) {
      return { applied: false, reason: 'already-dead' };
    }
    if (this.afterSteps(state, targetId, health.total, source) === 0) {
      return { applied: false, reason: 'blocked' };
    }
    return this.land(state, targetId, health, health.total, source);
  }

  /** `amount` after every damage step, in order, never below 0. */
  private afterSteps(
    state: GameState,
    targetId: EntityId,
    amount: number,
    source: DamageSource,
  ): number {
    return this.steps.reduce(
      (current, step) => Math.max(0, step.adjust({ targetId, amount: current, source }, state)),
      amount,
    );
  }

  /**
   * Takes `amount` from `health`, announces the hit and gives it to the kill credit, then announces
   * the kill when it took the last of it.
   */
  private land(
    state: GameState,
    targetId: EntityId,
    health: Health,
    amount: number,
    source: DamageSource,
  ): DamageResult {
    const { toShields, toBase } = health.applyDamage(amount);
    state.events.emit('damage-applied', { targetId, amount: toBase, absorbed: toShields, source });
    this.credit?.recordHit(state, targetId, source);
    const killed = health.isDead;
    if (killed) {
      const killer = this.credit?.killerOf(state, targetId, source) ?? source;
      state.events.emit('entity-died', { entityId: targetId, killer });
    }
    return { applied: true, amount: toBase, absorbed: toShields, killed };
  }
}
