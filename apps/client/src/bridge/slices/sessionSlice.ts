import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { MenuRoute, Overlay, SessionPhase } from '../events';

/** The session phase the UI shows, why it was entered, the menu sub-screen and the open overlay. */
type SessionSliceState = {
  readonly phase: SessionPhase;
  /** Why the phase was entered, e.g. `'select-timeout'`; `null` for the normal flow. */
  readonly reason: string | null;
  readonly menuRoute: MenuRoute;
  readonly overlay: Overlay | null;
};

const initialState: SessionSliceState = {
  phase: 'boot',
  reason: null,
  menuRoute: 'home',
  overlay: null,
};

/** Mirror of `SessionController`'s phase, fed by `session-phase`, `menu-route` and `overlay`. */
export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    phaseChanged(
      state,
      action: PayloadAction<{ readonly phase: SessionPhase; readonly reason: string | null }>,
    ) {
      state.phase = action.payload.phase;
      state.reason = action.payload.reason;
    },
    routeChanged(state, action: PayloadAction<MenuRoute>) {
      state.menuRoute = action.payload;
    },
    overlayChanged(state, action: PayloadAction<Overlay | null>) {
      state.overlay = action.payload;
    },
  },
  selectors: {
    selectSessionPhase: (state) => state.phase,
    selectSessionReason: (state) => state.reason,
    selectMenuRoute: (state) => state.menuRoute,
  },
});
