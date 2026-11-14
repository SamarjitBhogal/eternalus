import type {
  AbilityRejectReason,
  AbilitySlot,
} from '../../content/abilities/AbilityDefinition.types';
import type { SlotReadiness } from '../../state/SlotReadiness.types';

/** A `SlotReadiness` that refuses every slot not in `ready` with `on-cooldown`; prices are 0. */
export const onlyReady = (...ready: readonly AbilitySlot[]): SlotReadiness => ({
  blockedBy: (_state, _actor, slot): AbilityRejectReason | null =>
    ready.includes(slot) ? null : 'on-cooldown',
  priceOf: () => 0,
  cooldownTicksOf: () => 0,
});

/** A `SlotReadiness` that accepts every slot. */
export const allReady: SlotReadiness = onlyReady(
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
  'default-action',
);
