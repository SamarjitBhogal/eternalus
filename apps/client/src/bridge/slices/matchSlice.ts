import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { PlayableTeam } from '../domain.types';
import type { MatchClock } from '../events';
import type { CapturePointStatus, StructureStatus } from '../hud.types';

/** How a match ended, as the results screen shows it. */
type MatchResultSummary = { readonly winner: PlayableTeam | null };

/** Match clock, structure and capture rosters, and the result. */
type MatchSliceState = {
  /** `null` until the first `match-clock` (no made-up 0:00, DEC-17). */
  readonly clock: MatchClock | null;
  readonly structures: readonly StructureStatus[];
  readonly capturePoints: readonly CapturePointStatus[];
  readonly result: MatchResultSummary | null;
};

const initialState: MatchSliceState = {
  clock: null,
  structures: [],
  capturePoints: [],
  result: null,
};

/** Match state the UI shows, fed by `match-clock`, `structure-state` and `capture-state`. */
export const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    // Payloads are readonly and stored as given (PR1-21), so the reducers return new state.
    clockChanged: (state, action: PayloadAction<MatchClock>) => ({
      ...state,
      clock: action.payload,
    }),
    structuresChanged: (state, action: PayloadAction<readonly StructureStatus[]>) => ({
      ...state,
      structures: action.payload,
    }),
    capturePointsChanged: (state, action: PayloadAction<readonly CapturePointStatus[]>) => ({
      ...state,
      capturePoints: action.payload,
    }),
    reset: () => initialState,
  },
  selectors: {
    selectMatchResult: (state) => state.result,
    selectMatchClock: (state) => state.clock,
    selectStructures: (state) => state.structures,
    selectCapturePoints: (state) => state.capturePoints,
  },
});
