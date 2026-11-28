import { createSelector } from '@reduxjs/toolkit';

import type { MatchVerdict } from '../domain.types';
import { canRepeatSetup, hasResultsCountdown } from '../matchSetupRules';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { selectMatchVerdict } from './selectMatchVerdict';
import { selectVerdictLine } from './selectVerdictLine';

/**
 * What the results screen says under the banner: a line from content, or one of two fixed
 * statuses the screen words itself.
 */
export type ResultsStatus =
  | { readonly kind: 'verdict-line'; readonly text: string }
  | { readonly kind: 'opponent-left' }
  | { readonly kind: 'no-result' };

/** One player's side of an ended Duel's score: their name and kills. */
export type DuelScoreSide = { readonly name: string; readonly kills: number };

/** An ended Duel's final kill score, the player's own side first (SCRUM-449). */
type DuelFinalScore = { readonly own: DuelScoreSide; readonly opponent: DuelScoreSide };

/** The results screen's view model (13 §3). */
export type ResultsView = {
  /** The banner's verdict; `null` shows the plain title. */
  readonly verdict: MatchVerdict | null;
  /** The status line; `null` shows none (a finished Duel has a verdict and no line). */
  readonly status: ResultsStatus | null;
  /** Play again is offered (`canRepeatSetup`). */
  readonly canRematch: boolean;
  /** The countdown to the menu shows (`hasResultsCountdown`); never after a Duel. */
  readonly hasCountdown: boolean;
  /** Both players' names and kills after a Duel; `null` otherwise. */
  readonly duelScore: DuelFinalScore | null;
};

/**
 * The results screen's view model (DEC-250). A Duel the other player left says so under its
 * verdict (DEC-251); no verdict means no result was recorded; else the verdict line from content,
 * if any. After a Duel it carries the final score and no countdown (SCRUM-449).
 * Memoised on its inputs, so a countdown tick keeps the same object.
 */
export const selectResultsView = createSelector(
  [
    selectMatchVerdict,
    selectVerdictLine,
    matchSlice.selectors.selectDuelOutcome,
    matchSetupSlice.selectors.selectMode,
    matchSlice.selectors.selectVersus,
    matchSlice.selectors.selectDuelHud,
  ],
  (verdict, line, duel, mode, versus, hud): ResultsView => {
    let status: ResultsStatus | null = null;
    if (duel?.reason === 'opponent-left') status = { kind: 'opponent-left' };
    else if (verdict === null) status = { kind: 'no-result' };
    else if (line !== null) status = { kind: 'verdict-line', text: line };
    const duelScore: DuelFinalScore | null =
      mode === 'duel' && versus !== null && hud !== null
        ? {
            own: { name: versus.own, kills: hud.ownKills },
            opponent: { name: versus.opponent, kills: hud.opponentKills },
          }
        : null;
    return {
      verdict,
      status,
      canRematch: canRepeatSetup(mode),
      hasCountdown: hasResultsCountdown(mode),
      duelScore,
    };
  },
);
