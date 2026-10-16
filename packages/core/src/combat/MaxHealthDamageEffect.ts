import { Health } from '../components/Health';
import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import type { EntityId } from '../state/EntityStore.types';
import type { StatusTickContext, StatusTickEffect } from './StatusTickEffect.types';

/** Deals `periodic.amount` (a fraction) of the target's max health per stack (crushed). */
export class MaxHealthDamageEffect implements StatusTickEffect {
  /** Hits the target through the damage pipeline. */
  public tick(
    { definition, stacks, sourceId }: StatusEffectRuntime,
    targetId: EntityId,
    { state, damage }: StatusTickContext,
  ): void {
    const max = state.entities.get(targetId)?.findComponent(Health)?.max ?? 0;
    const amount = max * (definition.periodic?.amount ?? 0) * stacks;
    damage.apply(state, targetId, amount, {
      attackerId: sourceId,
      kind: 'status',
      definitionId: definition.id,
    });
  }
}
