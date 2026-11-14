import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LegendClassId, PlayableTeam } from '../domain.types';
import type {
  ClassSelection,
  CountdownKind,
  FilledRosters,
  MatchMode,
  RosterEntry,
} from '../events';

/** The match being set up, as the selection and loading screens show it. */
type MatchSetupSliceState = {
  /** Where the match runs; `null` until a setup is published. */
  readonly mode: MatchMode | null;
  readonly seed: number;
  readonly playerTeam: PlayableTeam | null;
  readonly selection: { readonly classId: LegendClassId | null; readonly specId: string | null };
  readonly allies: readonly RosterEntry[];
  readonly enemies: readonly RosterEntry[];
  /**
   * Remaining session time of each countdown, in ms (13 §2): character select, the pre-launch
   * reveal and the win/lose screen (DEC-78). A new kind is one `CountdownKind` member.
   */
  readonly countdownsMs: Readonly<Record<CountdownKind, number>>;
  /** LOCK IN was pressed: the pick holds and the locked view shows until the countdown ends (DEC-60). */
  readonly isLockedIn: boolean;
};

/** Milliseconds per second: the countdown shows whole seconds. */
const MS_PER_SECOND = 1000;

const initialState: MatchSetupSliceState = {
  mode: null,
  seed: 0,
  playerTeam: null,
  selection: { classId: null, specId: null },
  allies: [],
  enemies: [],
  countdownsMs: { select: 0, reveal: 0, results: 0 },
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
      action: PayloadAction<{
        readonly mode: MatchMode;
        readonly seed: number;
        readonly playerTeam: PlayableTeam;
      }>,
    ) {
      state.mode = action.payload.mode;
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
    /** One countdown's remaining time (the `countdown` event as it is). */
    countdownChanged(
      state,
      action: PayloadAction<{ readonly kind: CountdownKind; readonly remainingMs: number }>,
    ) {
      state.countdownsMs[action.payload.kind] = action.payload.remainingMs;
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
    selectMode: (state) => state.mode,
    selectAllies: (state) => state.allies,
    selectIsLockedIn: (state) => state.isLockedIn,
    /** One countdown's whole seconds left, rounded up, as it shows them (42000 → 42, 41001 → 42). */
    selectCountdownSeconds: (state, kind: CountdownKind) =>
      Math.ceil(state.countdownsMs[kind] / MS_PER_SECOND),
  },
});
