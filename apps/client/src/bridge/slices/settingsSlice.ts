import { createSlice } from '@reduxjs/toolkit';

import type { Binding } from '../Binding.types';

/** Per-user preferences (architecture 02 §7 "settings"). */
type SettingsSliceState = {
  readonly bindings: readonly Binding[];
  readonly audio: { readonly master: number; readonly music: number; readonly effects: number };
  readonly video: { readonly fullscreen: boolean; readonly renderScale: number };
  readonly accessibility: { readonly reduceMotion: boolean; readonly colourBlindMode: boolean };
};

const initialState: SettingsSliceState = {
  bindings: [],
  audio: { master: 1, music: 1, effects: 1 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: false },
};

// Session F owns this slice's body (defaults, reducers, selectors); session D created the shape.
/** Settings and keybindings. */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
});
