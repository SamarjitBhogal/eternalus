import type {
  AbilityRejectReason,
  AbilitySlot,
} from '../../content/abilities/AbilityDefinition.types';
import type { SlotReadiness } from '../SlotReadiness.types';

/** A `SlotReadiness` that refuses every slot not in `ready` with `on-cooldown`; prices are 0. */
export const onlyReady = (...ready: readonly AbilitySlot[]): SlotReadiness => {
  const blockedBy = (slot: AbilitySlot): AbilityRejectReason | null =>
    ready.includes(slot) ? null : 'on-cooldown';
  return {
    blockedBy: (_state, _actor, slot) => blockedBy(slot),
    slotBlockedBy: (_state, _actor, slot) => blockedBy(slot),
    priceOf: () => 0,
    cooldownTicksOf: () => 0,
  };
};

/** A `SlotReadiness` that accepts every slot; prices are 0. */
export const allReady: SlotReadiness = {
  blockedBy: () => null,
  slotBlockedBy: () => null,
  priceOf: () => 0,
  cooldownTicksOf: () => 0,
};
