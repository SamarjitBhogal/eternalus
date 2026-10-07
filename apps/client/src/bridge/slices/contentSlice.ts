import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Team } from '../domain.types';
import type { ContentCatalogue } from '../events';

const initialState: ContentCatalogue = {
  legendClasses: [],
  backgroundSets: [],
  profileDisplayName: '',
};

/** Display-ready content, projected once at boot from the catalogue source. */
export const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    catalogueLoaded: (_state, action: PayloadAction<ContentCatalogue>) => action.payload,
  },
  selectors: {
    selectLegendClasses: (state) => state.legendClasses,
    selectProfileDisplayName: (state) => state.profileDisplayName,
    /** The first background set for `team`, or `undefined` before content loads. */
    selectBackgroundSet: (state, team: Team) =>
      state.backgroundSets.find((set) => set.team === team),
  },
});
