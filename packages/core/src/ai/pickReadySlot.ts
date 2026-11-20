import type { Aim } from '../commands/Command.types';
import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';
import type { SlotReadiness } from '../state/SlotReadiness.types';
import type { BotTurn } from './BotLegendController.types';

/**
 * Picks the slot a bot casts (DEC-205): one of its filled slots that `readiness` accepts for `aim`
 * now, chosen with the turn's seeded RNG, so one seed gives one pick. Draws nothing from the RNG
 * when no slot is ready.
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
    .filter((slot) => readiness.blockedBy(turn.state, turn.id, slot, aim) === null);
  return ready.length === 0 ? null : (ready[turn.rng.nextInt(0, ready.length - 1)] ?? null);
};
