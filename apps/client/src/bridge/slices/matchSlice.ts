import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { PlayableTeam } from '../domain.types';
import type { MatchClock } from '../events';

/** How a match ended, as the results screen shows it. */
type MatchResultSummary = { readonly winner: PlayableTeam | null };

/** Match clock and result. */
type MatchSliceState = {
  readonly clock: MatchClock;
  readonly result: MatchResultSummary | null;
};

const initialState: MatchSliceState = {
  clock: { tick: 0, seconds: 0 },
  result: null,
};

// Session H owns this slice's body; session D created the shape and the clock reducer.
/** Match state the UI shows, fed by `match-clock`. */
export const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    clockChanged(state, action: PayloadAction<MatchClock>) {
      state.clock = action.payload;
    },
  },
  selectors: {
    selectMatchResult: (state) => state.result,
  },
});
