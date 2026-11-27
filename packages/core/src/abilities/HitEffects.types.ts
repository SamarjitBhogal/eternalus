import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { EntityId } from '../state/EntityStore.types';
import type { EffectStep } from './AbilityEffect.types';
import type { ComposableAbility } from './AbilityRegistry.types';

/**
 * The on-hit steps `HitEffects.runSteps` runs as one cast: who they are credited to and under
 * which id, the slot, the steps and how they grow with the caster's level.
 */
export type OnHitCast = {
  readonly casterId: EntityId;
  /**
   * The id the steps' damage is credited under: the status's (a basic attack) or the ability's
   * (a shot).
   */
  readonly sourceId: string;
  readonly slot: AbilitySlot;
  readonly steps: readonly EffectStep[];
  /** Per-level growth of a step field; `{}` for a status's steps. */
  readonly scaling: ComposableAbility['scaling'];
  readonly casterLevel: number;
};
