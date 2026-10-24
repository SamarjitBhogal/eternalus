import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER, figmaHudState, TEST_HUD_CATALOGUE } from '../hudFixtures';
import { assetsSlice } from '../slices/assetsSlice';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { selectStructureIconUrls } from './selectStructureIconUrls';

const ICON_IDS = [
  'structure-stronghold',
  'structure-wall',
  'structure-buff-tower',
  'structure-spawner-tower',
];

/** Each icon's file and its mirrored rendition. */
const ICON_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  ICON_IDS.flatMap((id) => [
    [id, `/${id}.webp`],
    [`${id}@mirrored`, `/${id}@mirrored.webp`],
  ]),
);

/** A Light player's store with the HUD catalogue, the Figma structures and `urls` loaded. */
function storeWith(urls: Readonly<Record<string, string>>) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      hud: TEST_HUD_CATALOGUE,
    }),
  );
  store.dispatch(matchSetupSlice.actions.setTeam({ seed: 1, playerTeam: 'light' }));
  store.dispatch(matchSlice.actions.structuresChanged(figmaHudState().match.structures));
  store.dispatch(assetsSlice.actions.groupUrlsChanged({ group: 'match', urls }));
  return store;
}

/** The strip's icons in tile order: stronghold, wall, 3 buff towers, 3 production towers. */
const stripOf = (suffix: string) => [
  `/structure-stronghold${suffix}.webp`,
  `/structure-wall${suffix}.webp`,
  ...Array.from({ length: 3 }, () => `/structure-buff-tower${suffix}.webp`),
  ...Array.from({ length: 3 }, () => `/structure-spawner-tower${suffix}.webp`),
];

describe('selectStructureIconUrls', () => {
  it("gives each allied tile its icon's file, in the strip's tile order", () => {
    expect(selectStructureIconUrls(storeWith(ICON_URLS).getState(), 'allied')).toEqual(stripOf(''));
  });

  it('gives each enemy tile the mirrored rendition of its icon', () => {
    expect(selectStructureIconUrls(storeWith(ICON_URLS).getState(), 'enemy')).toEqual(
      stripOf('@mirrored'),
    );
  });

  it('is null for every icon whose file has not loaded', () => {
    const urls = selectStructureIconUrls(storeWith({}).getState(), 'allied');
    expect(urls).toHaveLength(8);
    expect(urls.every((url) => url === null)).toBe(true);
  });

  it('returns the same array per side after a clock tick and after a HUD publish', () => {
    const store = storeWith(ICON_URLS);
    const allied = selectStructureIconUrls(store.getState(), 'allied');
    const enemy = selectStructureIconUrls(store.getState(), 'enemy');
    store.dispatch(matchSlice.actions.clockChanged({ tick: 30, seconds: 1 }));
    store.dispatch(hudSlice.actions.hudStateChanged(FIGMA_HUD_PLAYER));
    expect(selectStructureIconUrls(store.getState(), 'allied')).toBe(allied);
    expect(selectStructureIconUrls(store.getState(), 'enemy')).toBe(enemy);
  });
});
