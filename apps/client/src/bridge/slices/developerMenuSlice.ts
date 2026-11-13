import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DeveloperMenuState } from '../developerMenu.types';

const initialState: DeveloperMenuState = {
  isOpen: false,
  mobs: [],
  origins: [],
  humanLegendId: null,
};

/** The developer menu's state, fed by `developer-menu`; reset by every `match-setup`. */
export const developerMenuSlice = createSlice({
  name: 'developerMenu',
  initialState,
  reducers: {
    changed: (_state, action: PayloadAction<DeveloperMenuState>) => action.payload,
    reset: () => initialState,
  },
  selectors: {
    selectDeveloperMenu: (state) => state,
  },
});
