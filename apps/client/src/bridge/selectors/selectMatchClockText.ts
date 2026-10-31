import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';

const SECONDS_PER_MINUTE = 60;

/** Two digits at least: `5` → `'05'`, `100` → `'100'`. */
const twoDigits = (value: number): string => String(value).padStart(2, '0');

/**
 * Match seconds as `mm:ss`, whole seconds rounded down, minutes zero-padded to two digits and
 * never wrapped (`872` → `'14:32'`, `6000` → `'100:00'`).
 */
export function matchTimeText(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  return `${twoDigits(minutes)}:${twoDigits(total % SECONDS_PER_MINUTE)}`;
}

/** The elapsed match time as `mm:ss` (13 §3, `matchTimeText`); `null` before the first `match-clock`. */
export function selectMatchClockText(state: Pick<RootState, 'match'>): string | null {
  const clock = matchSlice.selectors.selectMatchClock(state);
  return clock === null ? null : matchTimeText(clock.seconds);
}
