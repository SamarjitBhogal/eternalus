import { describe, expect, it } from 'vitest';

import type { HudChrome } from '../catalogue.types';
import { TEST_HUD_CATALOGUE } from '../hudFixtures';
import { assetsSlice } from '../slices/assetsSlice';
import { contentSlice } from '../slices/contentSlice';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { selectAllegianceFlagUrls } from './selectAllegianceFlagUrls';

const FLAG_URLS = {
  'allegiance-flag': '/allegiance-flag.webp',
  'allegiance-flag@mirrored': '/allegiance-flag@mirrored.webp',
};

const NO_FLAGS = { ours: null, theirs: null, neutral: null };

/** A store with the HUD catalogue (with `chrome`) and `urls` loaded in the match group. */
function storeWith(
  urls: Readonly<Record<string, string>>,
  chrome: HudChrome | null = TEST_HUD_CATALOGUE.chrome,
) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      hud: { ...TEST_HUD_CATALOGUE, chrome },
    }),
  );
  store.dispatch(assetsSlice.actions.groupUrlsChanged({ group: 'match', urls, boxes: {} }));
  return store;
}

describe('selectAllegianceFlagUrls', () => {
  it('gives ours the upright flag, theirs the mirrored rendition and neutral none (CD-03)', () => {
    expect(selectAllegianceFlagUrls(storeWith(FLAG_URLS).getState())).toEqual({
      ours: '/allegiance-flag.webp',
      theirs: '/allegiance-flag@mirrored.webp',
      neutral: null,
    });
  });

  it('falls back to the upright file for theirs when the mirrored rendition is missing', () => {
    const upright = { 'allegiance-flag': FLAG_URLS['allegiance-flag'] };
    expect(selectAllegianceFlagUrls(storeWith(upright).getState()).theirs).toBe(
      '/allegiance-flag.webp',
    );
  });

  it('has no URL before the flag loads, nor without HUD chrome', () => {
    expect(selectAllegianceFlagUrls(storeWith({}).getState())).toEqual(NO_FLAGS);
    expect(selectAllegianceFlagUrls(storeWith(FLAG_URLS, null).getState())).toEqual(NO_FLAGS);
  });

  it('returns the same object after a match publish and after another group loads', () => {
    const store = storeWith(FLAG_URLS);
    const before = selectAllegianceFlagUrls(store.getState());
    store.dispatch(matchSlice.actions.clockChanged({ tick: 30, seconds: 1 }));
    store.dispatch(
      assetsSlice.actions.groupUrlsChanged({
        group: 'selection',
        urls: { other: '/other.webp' },
        boxes: {},
      }),
    );
    expect(selectAllegianceFlagUrls(store.getState())).toBe(before);
  });
});
