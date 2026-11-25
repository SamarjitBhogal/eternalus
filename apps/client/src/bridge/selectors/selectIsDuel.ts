import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';

/**
 * Whether the match on screen is an online Duel, read from the published setup (DEC-250 (1): the
 * session publishes it before `match-loading`), so it holds from the moment `MatchScreen` mounts,
 * before the first `duel-state`. Escape then asks to leave the Duel instead of opening the pause
 * menu, and the unload guard is on.
 */
export function selectIsDuel(state: Pick<RootState, 'matchSetup'>): boolean {
  return matchSetupSlice.selectors.selectMode(state) === 'duel';
}
