import type { StatusEffectRuntime } from '../components/StatusEffectRuntime';
import type { EntityId } from '../state/EntityStore.types';
import type { StatusTickContext, StatusTickEffect } from './StatusTickEffect.types';

/** Deals `periodic.amount` per stack, credited to whoever applied the status (bleed). */
export class PeriodicDamageEffect implements StatusTickEffect {
  /** Hits the target through the damage pipeline. */
  public tick(
    { definition, stacks, sourceId }: StatusEffectRuntime,
    targetId: EntityId,
    { state, damage }: StatusTickContext,
  ): void {
    const amount = (definition.periodic?.amount ?? 0) * stacks;
    damage.apply(state, targetId, amount, {
      attackerId: sourceId,
      kind: 'status',
      definitionId: definition.id,
    });
  }
}
