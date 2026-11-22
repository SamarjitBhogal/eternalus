import type { Aim } from '../components/AbilitySlotRuntime.types';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { SlotReadiness } from '../state/SlotReadiness.types';
import type { BotTurn } from './BotLegendController.types';

/**
 * The slots a bot never casts: the gadgets. Bots keep the Zealot's talons for now (owner card "PR9
 * bot swap", option A, DEC-303), so a bot never swaps to the bow.
 */
const BOT_SKIPPED_SLOTS: ReadonlySet<AbilitySlot> = new Set(['gadget-1', 'gadget-2']);

/**
 * Picks the slot a bot casts (DEC-205): one of its filled slots, gadgets left out, that
 * `readiness` accepts for `aim` now, chosen with the turn's seeded RNG, so one seed gives one
 * pick. Draws nothing from the RNG when no slot is ready.
 *
 * @returns The slot, or `null` when nothing is ready.
 */
export const pickReadySlot = (
  turn: BotTurn,
  readiness: SlotReadiness,
  aim: Aim,
): AbilitySlot | null => {
  const ready = turn.state.entities
    .filledSlotsOf(turn.id)
    .filter((slot) => !BOT_SKIPPED_SLOTS.has(slot))
    .filter((slot) => readiness.blockedBy(turn.state, turn.id, slot, aim) === null);
  return ready.length === 0 ? null : (ready[turn.rng.nextInt(0, ready.length - 1)] ?? null);
};
