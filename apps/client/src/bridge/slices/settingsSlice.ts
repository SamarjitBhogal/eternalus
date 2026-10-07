import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Binding } from '../Binding.types';

/** Per-user preferences (architecture 02 §7 "settings"). */
export type SettingsSliceState = {
  readonly bindings: readonly Binding[];
  readonly audio: { readonly master: number; readonly music: number; readonly effects: number };
  readonly video: { readonly fullscreen: boolean; readonly renderScale: number };
  readonly accessibility: { readonly reduceMotion: boolean; readonly colourBlindMode: boolean };
};

/** A partial change to the audio, video or accessibility settings (`update-settings` intent). */
export type SettingsPatch = {
  readonly audio?: Partial<SettingsSliceState['audio']>;
  readonly video?: Partial<SettingsSliceState['video']>;
  readonly accessibility?: Partial<SettingsSliceState['accessibility']>;
};

const initialState: SettingsSliceState = {
  bindings: [],
  audio: { master: 1, music: 1, effects: 1 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: false },
};

// Session F owns this slice's body (defaults, reducers, selectors); session D created the shape.
/** Settings and keybindings, fed by the `settings` event. */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    settingsChanged(_state, action: PayloadAction<SettingsSliceState>) {
      return action.payload;
    },
  },
});
