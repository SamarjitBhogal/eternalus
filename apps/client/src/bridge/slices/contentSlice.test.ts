import { describe, expect, it } from 'vitest';

import { classCardFixture } from '../catalogueFixtures';
import type { DisplayCatalogue } from '../catalogue.types';
import { TEST_HUD_CATALOGUE } from '../hudFixtures';
import { contentSlice } from './contentSlice';

const CATALOGUE: DisplayCatalogue = {
  legendClasses: [classCardFixture({ classId: 'warrior', displayName: 'Legionnaire' })],
  backgroundSets: [
    { id: 'menu', team: 'neutral', layers: [] },
    { id: 'light-a', team: 'light', layers: [] },
    { id: 'light-b', team: 'light', layers: [] },
  ],
  profileDisplayName: 'Chronicle',
  classSelectLayout: 'alternate',
  selectionBannerAssetId: 'selection-banner',
  selectClassChromeAssetId: 'select-class-chrome',
  lockInChromeAssetId: 'lock-in-chrome',
  effectsRenderer: 'figma-raster',
  contrastMode: 'figma',
  hud: TEST_HUD_CATALOGUE,
  teamNames: { light: 'Lux', dark: 'Umbra' },
};

const {
  selectBackgroundSet,
  selectLegendClasses,
  selectProfileDisplayName,
  selectClassSelectLayout,
  selectSelectionBannerAssetId,
  selectSelectClassChromeAssetId,
  selectLockInChromeAssetId,
  selectHudCatalogue,
  selectTeamNames,
} = contentSlice.selectors;

const loaded = () => ({
  content: contentSlice.reducer(undefined, contentSlice.actions.catalogueLoaded(CATALOGUE)),
});

describe('contentSlice', () => {
  it('is empty until the catalogue loads, then holds it', () => {
    expect(selectLegendClasses({ content: contentSlice.getInitialState() })).toEqual([]);
    const state = loaded();
    expect(selectLegendClasses(state)).toBe(CATALOGUE.legendClasses);
    expect(selectProfileDisplayName(state)).toBe('Chronicle');
  });

  it('starts on the primary Figma-raster layout in Figma colours, with no art and an empty HUD', () => {
    expect(contentSlice.getInitialState()).toMatchObject({
      classSelectLayout: 'primary',
      selectionBannerAssetId: null,
      selectClassChromeAssetId: null,
      lockInChromeAssetId: null,
      effectsRenderer: 'figma-raster',
      contrastMode: 'figma',
      hud: { structureKinds: [], objectiveKinds: [], chrome: null },
    });
  });

  it('selects the layout, the banner, both button chromes and the HUD catalogue', () => {
    const state = loaded();
    expect(selectClassSelectLayout(state)).toBe('alternate');
    expect(selectSelectionBannerAssetId(state)).toBe('selection-banner');
    expect(selectSelectClassChromeAssetId(state)).toBe('select-class-chrome');
    expect(selectLockInChromeAssetId(state)).toBe('lock-in-chrome');
    expect(selectHudCatalogue(state)).toBe(TEST_HUD_CATALOGUE);
  });

  it('selects the first background set of a team, or undefined', () => {
    const state = loaded();
    expect(selectBackgroundSet(state, 'light')?.id).toBe('light-a');
    expect(selectBackgroundSet(state, 'neutral')?.id).toBe('menu');
    expect(selectBackgroundSet(state, 'dark')).toBeUndefined();
  });

  it('selects the team names, empty until the catalogue loads', () => {
    expect(selectTeamNames({ content: contentSlice.getInitialState() })).toEqual({
      light: '',
      dark: '',
    });
    expect(selectTeamNames(loaded())).toBe(CATALOGUE.teamNames);
  });
});
