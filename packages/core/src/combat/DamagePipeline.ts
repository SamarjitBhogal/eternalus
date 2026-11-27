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
 * `DamageStep`, run in order before `Health`; add one in `defaultDamageSteps.ts`. `kill` is the one
 * hit no step changes.
 */
export class DamagePipeline {
  /**
   * @param steps - The rules each hit runs through, in order.
   * @param credit - Who a death by the gem counts for (DEC-346), and the last Legend hitters a
   *   boss keeps (DEC-416); without it every killer is the hit's source and no boss keeps one.
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
    return this.hit(state, targetId, amount, source, this.steps);
  }

  /**
   * Kills `targetId` with one hit from `source` for its whole health, shields included. No step
   * changes or blocks it (the gem eruption's blast, DEC-371 "BOSS guards" C: every unit in the zone
   * dies), and it emits the same events as a lethal `apply`, so kill credit and death are unchanged.
   * It skips breakability and friendly fire too: never use it on a wall, a gate or an ally.
   */
  public kill(state: GameState, targetId: EntityId, source: DamageSource): DamageResult {
    // `Health.applyDamage` takes only what the shields and health hold.
    return this.hit(state, targetId, Number.MAX_VALUE, source, []);
  }

  private hit(
    state: GameState,
    targetId: EntityId,
    amount: number,
    source: DamageSource,
    steps: readonly DamageStep[],
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
    const final = steps.reduce(
      (current, step) => Math.max(0, step.adjust({ targetId, amount: current, source }, state)),
      amount,
    );
    if (final === 0) {
      state.events.emit('damage-blocked', { targetId, source });
      return { applied: false, reason: 'blocked' };
    }

    const { toShields, toBase } = health.applyDamage(final);
    state.events.emit('damage-applied', { targetId, amount: toBase, absorbed: toShields, source });
    this.credit?.recordHit(state, targetId, source);

    // Not `health.isDead`: TypeScript still narrows it to false from the check above.
    const killed = health.current === 0;
    if (killed) {
      const killer = this.credit?.killerOf(state, targetId, source) ?? source;
      state.events.emit('entity-died', { entityId: targetId, killer });
    }
    return { applied: true, amount: toBase, absorbed: toShields, killed };
  }
}
