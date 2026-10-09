import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { InputAction } from '../Binding.types';
import type { PlayableTeam } from '../domain.types';

// Session G owns this slice's body and the HUD display types below; session D created the
// minimal shapes `events.ts` and `connectBusToStore` need. This file must not import events.ts.

/** A resource bar. */
type Bar = { readonly current: number; readonly max: number };

/** One ability slot as the HUD shows it. */
type AbilitySlotState = {
  readonly action: InputAction;
  /** 0 = ready, 1 = just used. */
  readonly cooldownFraction: number;
};

/** One announcer line. */
export type Announcement = { readonly id: string; readonly text: string };

/** One team's score. */
type TeamScore = { readonly team: PlayableTeam; readonly score: number };

/** Everything the HUD shows. */
type HudSliceState = {
  readonly health: Bar;
  readonly aether: Bar;
  readonly xp: { readonly level: number; readonly current: number; readonly next: number };
  readonly abilities: readonly AbilitySlotState[];
  readonly announcements: readonly Announcement[];
  readonly scores: readonly TeamScore[];
};

/** The `hud-state` payload: the HUD minus announcements, which arrive one by one. */
export type HudSnapshot = Omit<HudSliceState, 'announcements'>;

const initialState: HudSliceState = {
  health: { current: 0, max: 0 },
  aether: { current: 0, max: 0 },
  xp: { level: 0, current: 0, next: 0 },
  abilities: [],
  announcements: [],
  scores: [],
};

/** HUD state, fed by `hud-state` and `announcement`. */
export const hudSlice = createSlice({
  name: 'hud',
  initialState,
  reducers: {
    hudStateChanged(state, action: PayloadAction<HudSnapshot>) {
      return { ...action.payload, announcements: state.announcements };
    },
    announced(state, action: PayloadAction<Announcement>) {
      state.announcements.push(action.payload);
    },
  },
});
