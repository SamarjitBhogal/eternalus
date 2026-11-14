import type { MatchVerdict } from '../domain.types';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';

/**
 * How the ended match went for the setup's player team (game-loop plan §4.5): `victory` when it
 * won, `defeat` when the other team won, `draw` with no winner. It compares the result's winner
 * with the team and never reads core's phase, so it holds for two humans (ADR 0016): an online
 * Duel's winner comes from `duel-ended` and its team from the setup. `null` before either event,
 * without a setup, or for a Duel the other player left.
 */
export function selectMatchVerdict(
  state: Pick<RootState, 'match' | 'matchSetup'>,
): MatchVerdict | null {
  const duel = matchSlice.selectors.selectDuelOutcome(state);
  // A Duel the other player left has no verdict yet: what the player who stayed gets waits for
  // the Duel's own win rules (INBOX HC-Q48 (1), DEC-250).
  if (duel?.reason === 'opponent-left') return null;
  const ended = matchSlice.selectors.selectMatchResult(state) ?? duel;
  const team = matchSetupSlice.selectors.selectPlayerTeam(state);
  if (ended === null || team === null) return null;
  if (ended.winner === null) return 'draw';
  return ended.winner === team ? 'victory' : 'defeat';
}
