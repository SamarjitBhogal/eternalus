import type { MatchResult } from '@eternalus/core';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { MatchEnding } from '../domain.types';
import type { BridgeEventMap, MatchClock } from '../events';
import type { CapturePointStatus, DuelHudState, DuelVersus, StructureStatus } from '../hud.types';

/** Match clock, structure and capture rosters, and the result. */
type MatchSliceState = {
  /** `null` until the first `match-clock` (no made-up 0:00, DEC-17). */
  readonly clock: MatchClock | null;
  readonly structures: readonly StructureStatus[];
  readonly capturePoints: readonly CapturePointStatus[];
  /** Core's result (13 §5), `null` until `match-ended`; it outlives the match until the next setup. */
  readonly result: MatchResult | null;
  /** The ended match's length in match seconds, the countdown not counted (DEC-278); `null` until `match-ended`. */
  readonly durationSeconds: number | null;
  /** The Duel's names for the VERSUS screen; `null` outside a Duel. */
  readonly versus: DuelVersus | null;
  /** How the server ended an online Duel (ADR 0016), `null` until `duel-ended`. */
  readonly duel: MatchEnding | null;
  /** The Duel's scoreboard; `null` outside a Duel. */
  readonly duelHud: DuelHudState | null;
  /** The reconnect window of a disconnected Duel opponent, in ms; `null` while they are connected. */
  readonly opponentGraceMs: number | null;
  /** Whether this player's Duel connection dropped and is reconnecting (DEC-349). */
  readonly isReconnecting: boolean;
};

const initialState: MatchSliceState = {
  clock: null,
  structures: [],
  capturePoints: [],
  result: null,
  durationSeconds: null,
  versus: null,
  duel: null,
  duelHud: null,
  opponentGraceMs: null,
  isReconnecting: false,
};

/**
 * Match state the UI shows, fed by `match-clock`, `structure-state`, `capture-state` and
 * `match-ended`, by `duel-ended` for an online Duel, and by `duel-versus`, `duel-state` and
 * `duel-connection` in a Duel.
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
    duelEnded: (state, action: PayloadAction<MatchEnding>) => ({
      ...state,
      duel: action.payload,
    }),
    versusChanged: (state, action: PayloadAction<DuelVersus>) => ({
      ...state,
      versus: action.payload,
    }),
    duelHudChanged: (state, action: PayloadAction<DuelHudState>) => ({
      ...state,
      duelHud: action.payload,
    }),
    opponentPresenceChanged: (state, action: PayloadAction<number | null>) => ({
      ...state,
      opponentGraceMs: action.payload,
    }),
    connectionChanged: (state, action: PayloadAction<boolean>) => ({
      ...state,
      isReconnecting: action.payload,
    }),
    reset: () => initialState,
  },
  selectors: {
    selectMatchResult: (state) => state.result,
    selectMatchDurationSeconds: (state) => state.durationSeconds,
    selectDuelOutcome: (state) => state.duel,
    selectVersus: (state) => state.versus,
    selectDuelHud: (state) => state.duelHud,
    selectIsReconnecting: (state) => state.isReconnecting,
    selectMatchClock: (state) => state.clock,
    /** The pre-match countdown's number (0 is "START"); `null` before the first clock and after it. */
    selectMatchCountdown: (state) => state.clock?.countdown ?? null,
    selectStructures: (state) => state.structures,
    selectCapturePoints: (state) => state.capturePoints,
    selectOpponentGraceMs: (state) => state.opponentGraceMs,
  },
});
