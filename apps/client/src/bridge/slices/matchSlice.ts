import type { MatchResult } from '@eternalus/core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { BridgeEventMap, DuelOutcome, MatchClock } from '../events';
import type { CapturePointStatus, StructureStatus } from '../hud.types';

/** Match clock, structure and capture rosters, and the result. */
type MatchSliceState = {
  /** `null` until the first `match-clock` (no made-up 0:00, DEC-17). */
  readonly clock: MatchClock | null;
  readonly structures: readonly StructureStatus[];
  readonly capturePoints: readonly CapturePointStatus[];
  /** Core's result (13 §5), `null` until `match-ended`; it outlives the match until the next setup. */
  readonly result: MatchResult | null;
  /** The ended match's length in match seconds; `null` until `match-ended`. */
  readonly durationSeconds: number | null;
  /** How the server ended an online Duel (ADR 0016), `null` until `duel-ended`. */
  readonly duel: DuelOutcome | null;
};

const initialState: MatchSliceState = {
  clock: null,
  structures: [],
  capturePoints: [],
  result: null,
  durationSeconds: null,
  duel: null,
};

/**
 * Match state the UI shows, fed by `match-clock`, `structure-state`, `capture-state` and
 * `match-ended`, and by `duel-ended` for an online Duel.
 */
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
    ended: (state, action: PayloadAction<BridgeEventMap['match-ended']>) => ({
      ...state,
      result: action.payload.result,
      durationSeconds: action.payload.durationSeconds,
    }),
    duelEnded: (state, action: PayloadAction<DuelOutcome>) => ({
      ...state,
      duel: action.payload,
    }),
    reset: () => initialState,
  },
  selectors: {
    selectMatchResult: (state) => state.result,
    selectMatchDurationSeconds: (state) => state.durationSeconds,
    selectDuelOutcome: (state) => state.duel,
    selectMatchClock: (state) => state.clock,
    selectStructures: (state) => state.structures,
    selectCapturePoints: (state) => state.capturePoints,
  },
});
