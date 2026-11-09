import { Health } from '../components/Health';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamageSource } from '../state/GameEvents.types';
import type { DamageResult } from './DamagePipeline.types';
import type { DamageStep } from './DamageStep.types';
import { createDefaultDamageSteps } from './defaultDamageSteps';

/**
 * The one way damage reaches `Health` (architecture 05 §9). Anything with `Health` can be hit the
 * same way: Legends, mobs, bosses, structures and destructible obstacles such as trees. An entity
 * without `Health` (an indestructible obstacle) is never damaged.
 *
 * Emits `damage-applied` for every hit that lands and `entity-died` with the killer for the hit
 * that takes health to 0; `DeathSystem` removes the dead later in the tick.
 *
 * Every rule that changes a hit (friendly fire, statuses, structure multipliers, breakability) is a
 * `DamageStep`, run in order before `Health`; add one in `defaultDamageSteps.ts`.
 */
export class DamagePipeline {
  /** @param steps - The rules each hit runs through, in order. */
  public constructor(private readonly steps: readonly DamageStep[] = createDefaultDamageSteps()) {}

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
    const final = this.steps.reduce(
      (current, step) => Math.max(0, step.adjust({ targetId, amount: current, source }, state)),
      amount,
    );
    if (final === 0) {
      return { applied: false, reason: 'blocked' };
    }

    const { toShields, toBase } = health.applyDamage(final);
    state.events.emit('damage-applied', { targetId, amount: toBase, absorbed: toShields, source });

    // Not `health.isDead`: TypeScript still narrows it to false from the check above.
    const killed = health.current === 0;
    if (killed) {
      state.events.emit('entity-died', { entityId: targetId, killer: source });
    }
    return { applied: true, amount: toBase, absorbed: toShields, killed };
  }
}
