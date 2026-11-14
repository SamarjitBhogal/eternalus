import type { MatchResultSummary } from '../../bridge/events';
import { STRINGS } from '../strings';

/**
 * The verdict line for `result`, from the viewing player's own team: the opponent leaving wins
 * over everything, then a draw, then victory or defeat.
 */
export function resultVerdict(result: MatchResultSummary): string {
  if (result.reason === 'opponent-left') return STRINGS.results.opponentLeft;
  if (result.winner === null) return STRINGS.results.draw;
  return result.winner === result.ownTeam ? STRINGS.results.victory : STRINGS.results.defeat;
}
