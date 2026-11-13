import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { MatchClock, MatchResultSummary } from '../events';
import type { CapturePointStatus, DuelHudState, DuelVersus, StructureStatus } from '../hud.types';

/** Match clock, structure and capture rosters, and the result. */
type MatchSliceState = {
  /** `null` until the first `match-clock` (no made-up 0:00, DEC-17). */
  readonly clock: MatchClock | null;
  readonly structures: readonly StructureStatus[];
  readonly capturePoints: readonly CapturePointStatus[];
  readonly result: MatchResultSummary | null;
  /** The Duel's names for the VERSUS screen; `null` outside a Duel. */
  readonly versus: DuelVersus | null;
  /** The Duel's scoreboard and countdown; `null` outside a Duel. */
  readonly duel: DuelHudState | null;
};

const initialState: MatchSliceState = {
  clock: null,
  structures: [],
  capturePoints: [],
  result: null,
  versus: null,
  duel: null,
};

/** Match state the UI shows, fed by `match-clock`, `structure-state` and `capture-state`. */
export const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    // Payloads are readonly and stored as given, so the reducers return new state.
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
    resultChanged: (state, action: PayloadAction<MatchResultSummary>) => ({
      ...state,
      result: action.payload,
    }),
    versusChanged: (state, action: PayloadAction<DuelVersus>) => ({
      ...state,
      versus: action.payload,
    }),
    duelChanged: (state, action: PayloadAction<DuelHudState>) => ({
      ...state,
      duel: action.payload,
    }),
    reset: () => initialState,
  },
  selectors: {
    selectMatchResult: (state) => state.result,
    selectMatchClock: (state) => state.clock,
    selectStructures: (state) => state.structures,
    selectCapturePoints: (state) => state.capturePoints,
    selectVersus: (state) => state.versus,
    selectDuel: (state) => state.duel,
  },
});
