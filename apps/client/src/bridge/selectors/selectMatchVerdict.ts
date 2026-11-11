import type { MatchVerdict } from '../domain.types';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';

/**
 * How the ended match went for the setup's player team (game-loop plan §4.5): `victory` when it
 * won, `defeat` when the other team won, `draw` with no winner. It compares the result's winner
 * with the team and never reads core's phase, so it holds for two humans (ADR 0016). `null`
 * before `match-ended` or without a setup.
 */
export function selectMatchVerdict(
  state: Pick<RootState, 'match' | 'matchSetup'>,
): MatchVerdict | null {
  const result = matchSlice.selectors.selectMatchResult(state);
  const team = matchSetupSlice.selectors.selectPlayerTeam(state);
  if (result === null || team === null) return null;
  if (result.winner === null) return 'draw';
  return result.winner === team ? 'victory' : 'defeat';
}
