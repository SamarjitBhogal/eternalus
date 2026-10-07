import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Binding, InputAction, InputChord } from '../Binding.types';

/** Per-user preferences (architecture 02 §7 "settings"). */
export type SettingsSliceState = {
  readonly bindings: readonly Binding[];
  readonly audio: { readonly master: number; readonly music: number; readonly effects: number };
  readonly video: { readonly fullscreen: boolean; readonly renderScale: number };
  readonly accessibility: { readonly reduceMotion: boolean; readonly colourBlindMode: boolean };
};

/** A change to some of the non-binding settings, as the settings screen sends it. */
export type SettingsPatch = {
  readonly audio?: Partial<SettingsSliceState['audio']>;
  readonly video?: Partial<SettingsSliceState['video']>;
  readonly accessibility?: Partial<SettingsSliceState['accessibility']>;
};

// Bindings start empty: the defaults live in game/input/keybindings.ts, which bridge/ may not
// import. The game publishes the loaded settings, defaults filled in, at boot.
const initialState: SettingsSliceState = {
  bindings: [],
  audio: { master: 1, music: 1, effects: 1 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: false },
};

/** Settings and keybindings, replaced whole each time the game publishes them. */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    settingsChanged(_state, action: PayloadAction<SettingsSliceState>) {
      return action.payload;
    },
  },
  selectors: {
    selectBindings: (state) => state.bindings,
    /** The label of the first chord bound to `action`, or `null` when it is unbound. */
    selectBindingLabel: (state, action: InputAction): string | null =>
      state.bindings.find((binding) => binding.action === action)?.chords[0]?.label ?? null,
    /** The action that already holds the same physical input as `chord`, if any. */
    selectChordOwner: (state, chord: InputChord): InputAction | null =>
      state.bindings.find((binding) =>
        binding.chords.some((held) => held.device === chord.device && held.code === chord.code),
      )?.action ?? null,
    selectAudio: (state) => state.audio,
    selectVideo: (state) => state.video,
    selectAccessibility: (state) => state.accessibility,
  },
});
