import type { Aim } from '../commands/Command.types';
import type {
  AbilityRejectReason,
  AbilitySlot,
} from '../content/abilities/AbilityDefinition.types';
import type { GameState } from './GameState';
import type { EntityId } from './EntityStore.types';

/**
 * What the player snapshot and the bots ask about an ability slot. `abilities/CastReadiness`
 * implements it and `Simulation` injects it, because `state/` and `ai/` may not import
 * `abilities/` (the way `CastAbilityHandler` gets its `CastCheck`).
 */
export type SlotReadiness = {
  /**
   * Why `actorId` may not cast `slot` aimed at `aim` now, or `null` when it may. `unknown-entity`
   * only for an id that names no entity.
   */
  blockedBy(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
    aim: Aim,
  ): AbilityRejectReason | 'unknown-entity' | null;
  /** What `abilityId` costs `actorId` now, after status modifiers (concussion). */
  priceOf(state: GameState, actorId: EntityId, abilityId: string): number;
  /** The full cooldown of `abilityId` in ticks. */
  cooldownTicksOf(abilityId: string): number;
};
