import type { Aim } from '../components/AbilitySlotRuntime.types';
import type {
  AbilityRejectReason,
  AbilitySlot,
} from '../content/abilities/AbilityDefinition.types';
import type { GameState } from './GameState';
import type { EntityId } from './EntityStore.types';

/**
 * The cast rules of a match, as the `cast-ability` handler, the player snapshot and the bots ask
 * them. `abilities/CastValidator` implements it and `Simulation` injects its one validator,
 * because `commands/`, `state/` and `ai/` may not import `abilities/` (ADR 0026 decision 2).
 */
export interface SlotReadiness {
  /**
   * Why `actorId` may not cast `slot` aimed at `aim` now, or `null` when it may: the full check.
   * `unknown-entity` only for an id that names no entity.
   */
  blockedBy(
    state: GameState,
    actorId: EntityId,
    slot: AbilitySlot,
    aim: Aim,
  ): AbilityRejectReason | 'unknown-entity' | null;
  /**
   * Why `actorId` may not cast `slot` now whatever the aim, or `null`: every check but the aim's.
   *
   * @throws Error when `actorId` names no entity: the caller holds the entity.
   */
  slotBlockedBy(state: GameState, actorId: EntityId, slot: AbilitySlot): AbilityRejectReason | null;
  /** What `abilityId` costs `actorId` now, after status modifiers (concussion). */
  priceOf(state: GameState, actorId: EntityId, abilityId: string): number;
  /** The full cooldown of `abilityId` in ticks. */
  cooldownTicksOf(abilityId: string): number;
}
