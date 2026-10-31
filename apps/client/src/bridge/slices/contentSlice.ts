import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DisplayCatalogue } from '../catalogue.types';
import type { Team } from '../domain.types';

const initialState: DisplayCatalogue = {
  legendClasses: [],
  backgroundSets: [],
  profileDisplayName: '',
  classSelectLayout: 'primary',
  selectionBannerAssetId: null,
  selectClassChromeAssetId: null,
  lockInChromeAssetId: null,
  effectsRenderer: 'figma-raster',
  contrastMode: 'figma',
  hud: { structureKinds: [], objectiveKinds: [], chrome: null },
  teamNames: { light: '', dark: '' },
  botRoster: { id: '', laners: [], enemyRover: 'mirror-player' },
  verdictLines: {},
  sovereignNames: { light: '', dark: '' },
};

/** Display-ready content, projected once at boot from the catalogue source. */
export const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    catalogueLoaded: (_state, action: PayloadAction<DisplayCatalogue>) => action.payload,
  },
  selectors: {
    selectLegendClasses: (state) => state.legendClasses,
    selectProfileDisplayName: (state) => state.profileDisplayName,
    /** The first background set for `team`, or `undefined` before content loads. */
    selectBackgroundSet: (state, team: Team) =>
      state.backgroundSets.find((set) => set.team === team),
    selectClassSelectLayout: (state) => state.classSelectLayout,
    selectSelectionBannerAssetId: (state) => state.selectionBannerAssetId,
    selectSelectClassChromeAssetId: (state) => state.selectClassChromeAssetId,
    selectLockInChromeAssetId: (state) => state.lockInChromeAssetId,
    selectHudCatalogue: (state) => state.hud,
    selectTeamNames: (state) => state.teamNames,
    selectVerdictLines: (state) => state.verdictLines,
    selectSovereignNames: (state) => state.sovereignNames,
  },
});
