import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';

const SECONDS_PER_MINUTE = 60;

/** Two digits at least: `5` → `'05'`, `100` → `'100'`. */
const twoDigits = (value: number): string => String(value).padStart(2, '0');

/**
 * The elapsed match time as `mm:ss` (13 §3), minutes zero-padded to two digits and never
 * wrapped (`872` → `'14:32'`, `6000` → `'100:00'`); `null` before the first `match-clock`.
 */
export function selectMatchClockText(state: Pick<RootState, 'match'>): string | null {
  const clock = matchSlice.selectors.selectMatchClock(state);
  if (clock === null) return null;
  const total = Math.max(0, Math.floor(clock.seconds));
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  return `${twoDigits(minutes)}:${twoDigits(total % SECONDS_PER_MINUTE)}`;
}
