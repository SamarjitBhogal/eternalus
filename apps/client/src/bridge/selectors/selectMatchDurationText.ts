import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';
import { matchTimeText } from './selectMatchClockText';

/** The ended match's length as `mm:ss` (as the match clock shows time); `null` before `match-ended`. */
export function selectMatchDurationText(state: Pick<RootState, 'match'>): string | null {
  const seconds = matchSlice.selectors.selectMatchDurationSeconds(state);
  return seconds === null ? null : matchTimeText(seconds);
}
