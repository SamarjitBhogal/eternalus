import type { FirstTickRules } from './GuardRoster.types';

/** When each kind of guard plan activation first fills its posts (architecture 18 §7.1, 12 §3). */
export const GUARD_FIRST_TICKS: FirstTickRules = {
  'match-start': () => 0,
  'countdown-end': (state, { delayTicks }) => state.match.countdownEndTick + delayTicks,
  // `GuardRoster.activate` fills these posts when the gem erupts.
  'gem-eruption': () => null,
};
