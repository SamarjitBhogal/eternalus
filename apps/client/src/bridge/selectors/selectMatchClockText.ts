import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';
import { matchTimeText } from './matchTimeText';

/** The elapsed match time as `mm:ss` (13 §3, `matchTimeText`); `null` before the first `match-clock`. */
export function selectMatchClockText(state: Pick<RootState, 'match'>): string | null {
  const clock = matchSlice.selectors.selectMatchClock(state);
  return clock === null ? null : matchTimeText(clock.seconds);
}
