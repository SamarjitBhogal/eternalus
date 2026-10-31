import type { MatchVerdict, PlayableTeam } from '../domain.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import type { RootState } from '../store';
import { selectMatchVerdict } from './selectMatchVerdict';

/** The placeholder a verdict line names the fallen sovereign with (core `verdictLines.ts`). */
const NAME_PLACEHOLDER = '{name}';

const ENEMY_TEAM: Readonly<Record<PlayableTeam, PlayableTeam>> = { light: 'dark', dark: 'light' };

/** Whose sovereign fell, seen from the player's team: the enemy's on a victory, its own otherwise. */
const FALLEN_TEAM: Readonly<Record<MatchVerdict, (team: PlayableTeam) => PlayableTeam>> = {
  victory: (team) => ENEMY_TEAM[team],
  defeat: (team) => team,
  draw: (team) => team,
};

/**
 * The line under the verdict (12 §9: `verdictLines[condition]`, the player's side of it), with
 * `{name}` filled in from content: the fallen team's sovereign name (DEC-74). `null` before
 * `match-ended`, without a setup, or for a condition content has no line for.
 */
export function selectVerdictLine(
  state: Pick<RootState, 'match' | 'matchSetup' | 'content'>,
): string | null {
  const verdict = selectMatchVerdict(state);
  const result = matchSlice.selectors.selectMatchResult(state);
  const team = matchSetupSlice.selectors.selectPlayerTeam(state);
  if (verdict === null || result === null || team === null) return null;
  const line = contentSlice.selectors.selectVerdictLines(state)[result.condition]?.[verdict];
  if (line === undefined) return null;
  const name = contentSlice.selectors.selectSovereignNames(state)[FALLEN_TEAM[verdict](team)];
  return line.replaceAll(NAME_PLACEHOLDER, name);
}
