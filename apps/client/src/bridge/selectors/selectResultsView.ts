import { createSelector } from '@reduxjs/toolkit';

import type { MatchVerdict } from '../domain.types';
import { canRepeatSetup } from '../matchSetupRules';
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

/** The results screen's view model (13 §3). */
export type ResultsView = {
  /** The banner's verdict; `null` shows the plain title. */
  readonly verdict: MatchVerdict | null;
  /** The status line; `null` shows none (a finished Duel has a verdict and no line). */
  readonly status: ResultsStatus | null;
  /** Play again is offered (`canRepeatSetup`). */
  readonly canRematch: boolean;
};

/**
 * The results screen's view model (DEC-250). A Duel the other player left has no verdict and says so; no
 * verdict otherwise means no result was recorded; else the verdict line from content, if any.
 * Memoised on its inputs, so a countdown tick keeps the same object.
 */
export const selectResultsView = createSelector(
  [
    selectMatchVerdict,
    selectVerdictLine,
    matchSlice.selectors.selectDuelOutcome,
    matchSetupSlice.selectors.selectMode,
  ],
  (verdict, line, duel, mode): ResultsView => {
    let status: ResultsStatus | null = null;
    if (duel?.reason === 'opponent-left') status = { kind: 'opponent-left' };
    else if (verdict === null) status = { kind: 'no-result' };
    else if (line !== null) status = { kind: 'verdict-line', text: line };
    return { verdict, status, canRematch: canRepeatSetup(mode) };
  },
);
