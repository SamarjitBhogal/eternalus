import { Health } from '../components/Health';
import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import type { StatusTickSpec } from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import type { StatusTickContext, StatusTickEffect } from './StatusTickEffect.types';

/**
 * A `damage` tick: `amount`, or `fractionOfMax` of the target's max health, per stack, through the
 * damage pipeline and credited to whoever applied the status (bleed, crushed).
 */
export class DamageStatusTick implements StatusTickEffect {
  /** Hits the target once. */
  public tick(
    spec: StatusTickSpec,
    { definition, stacks, sourceId }: StatusEffectRuntime,
    targetId: EntityId,
    { state, damage }: StatusTickContext,
  ): void {
    const perStack =
      'amount' in spec
        ? spec.amount
        : spec.fractionOfMax * (state.entities.get(targetId)?.findComponent(Health)?.max ?? 0);
    damage.apply(state, targetId, perStack * stacks, {
      attackerId: sourceId,
      kind: 'status',
      definitionId: definition.id,
    });
  }
}
