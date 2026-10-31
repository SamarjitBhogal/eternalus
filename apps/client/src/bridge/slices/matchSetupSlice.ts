import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LegendClassId, PlayableTeam } from '../domain.types';
import type { ClassSelection, FilledRosters, RosterEntry } from '../events';

/** The match being set up, as the selection and loading screens show it. */
type MatchSetupSliceState = {
  readonly seed: number;
  readonly playerTeam: PlayableTeam | null;
  readonly selection: { readonly classId: LegendClassId | null; readonly specId: string | null };
  readonly allies: readonly RosterEntry[];
  readonly enemies: readonly RosterEntry[];
  /** Remaining character-select time (session time, ms). */
  readonly countdownMs: number;
  /** Remaining pre-launch reveal time (session time, ms). */
  readonly revealMs: number;
  /** LOCK IN was pressed: the pick holds and the locked view shows until the countdown ends (DEC-60). */
  readonly isLockedIn: boolean;
};

/** Milliseconds per second: the countdown shows whole seconds. */
const MS_PER_SECOND = 1000;

const initialState: MatchSetupSliceState = {
  seed: 0,
  playerTeam: null,
  selection: { classId: null, specId: null },
  allies: [],
  enemies: [],
  countdownMs: 0,
  revealMs: 0,
  isLockedIn: false,
};

// Session E owns this slice's body (reducers and selectors); session D created it with the
// reducers `connectBusToStore` dispatches.
/**
 * Mirror of `SessionController`'s match setup, fed by `match-setup`, `class-selection`,
 * `selection-locked` and `countdown`.
 */
export const matchSetupSlice = createSlice({
  name: 'matchSetup',
  initialState,
  reducers: {
    setTeam(
      state,
      action: PayloadAction<{ readonly seed: number; readonly playerTeam: PlayableTeam }>,
    ) {
      state.seed = action.payload.seed;
      state.playerTeam = action.payload.playerTeam;
    },
    setRosters(
      state,
      action: PayloadAction<{
        readonly allies: readonly RosterEntry[];
        readonly enemies: readonly RosterEntry[];
      }>,
    ) {
      state.allies = [...action.payload.allies];
      state.enemies = [...action.payload.enemies];
    },
    /** `null` clears the pick (back to the class step). */
    select(state, action: PayloadAction<ClassSelection | null>) {
      state.selection = action.payload ?? { classId: null, specId: null };
    },
    setCountdown(state, action: PayloadAction<number>) {
      state.countdownMs = action.payload;
    },
    setReveal(state, action: PayloadAction<number>) {
      state.revealMs = action.payload;
    },
    /** LOCK IN: the filled rosters replace the draft's, and the pick is locked (DEC-60, DEC-61). */
    lockIn(state, action: PayloadAction<FilledRosters>) {
      state.allies = [...action.payload.allies];
      state.enemies = [...action.payload.enemies];
      state.isLockedIn = true;
    },
    reset: () => initialState,
  },
  selectors: {
    selectSelection: (state) => state.selection,
    selectPlayerTeam: (state) => state.playerTeam,
    selectAllies: (state) => state.allies,
    selectIsLockedIn: (state) => state.isLockedIn,
    /** Whole seconds left, rounded up, as the countdown shows them (42000 → 42, 41001 → 42). */
    selectCountdownSeconds: (state) => Math.ceil(state.countdownMs / MS_PER_SECOND),
  },
});
