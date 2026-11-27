import type { Aim } from '../components/AbilitySlotRuntime.types';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { SlotReadiness } from '../state/SlotReadiness.types';
import type { BotTurn } from './BotLegendController.types';

/**
 * Picks the slot a bot casts (DEC-205): one of its filled slots that a bot may cast and that
 * `readiness` accepts for `aim` now, chosen with the turn's seeded RNG, so one seed gives one pick.
 * A bot never casts an ability authored `canBotCast: false`: it never swaps the Zealot's talons
 * for the bow (`INBOX.md` HC-Q83, option A). Draws nothing from the RNG when no slot is ready.
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
    .filter((slot) => readiness.canBotCast(turn.state, turn.id, slot))
    .filter((slot) => readiness.blockedBy(turn.state, turn.id, slot, aim) === null);
  return ready.length === 0 ? null : (ready[turn.rng.nextInt(0, ready.length - 1)] ?? null);
};
