import { describe, expect, it } from 'vitest';

import type { CreditEntry } from '../events';
import { assetsSlice } from './assetsSlice';

const { groupUrlsChanged, creditsLoaded } = assetsSlice.actions;
const { selectAssetBox, selectAssetUrl, selectCredits } = assetsSlice.selectors;

const PORTRAIT_TILE = { left: 1775, top: 848, width: 60, height: 60 };
const FRAME = { left: 1616, top: 27, width: 295, height: 284 };

const loaded = assetsSlice.reducer(
  assetsSlice.reducer(
    undefined,
    groupUrlsChanged({
      group: 'selection',
      urls: {
        'oracle-portrait': '/oracle-portrait.webp',
        'oracle-portrait@ally-tile': '/oracle-portrait@ally-tile.webp',
      },
      boxes: { 'oracle-portrait@ally-tile': PORTRAIT_TILE },
    }),
  ),
  groupUrlsChanged({
    group: 'match',
    urls: { 'minimap-frame': '/minimap-frame.webp' },
    boxes: { 'minimap-frame': FRAME },
  }),
);

describe('assetsSlice', () => {
  it('has no URL before the group loads, nor for a null id', () => {
    const state = { assets: assetsSlice.getInitialState() };
    expect(selectAssetUrl(state, 'oracle-portrait')).toBeNull();
    expect(selectAssetUrl({ assets: loaded }, null)).toBeNull();
  });

  it('finds an asset in any loaded group', () => {
    expect(selectAssetUrl({ assets: loaded }, 'oracle-portrait')).toBe('/oracle-portrait.webp');
    expect(selectAssetUrl({ assets: loaded }, 'minimap-frame')).toBe('/minimap-frame.webp');
  });

  it('prefers the rendition file and falls back to the asset file', () => {
    const state = { assets: loaded };
    expect(selectAssetUrl(state, 'oracle-portrait', 'ally-tile')).toBe(
      '/oracle-portrait@ally-tile.webp',
    );
    expect(selectAssetUrl(state, 'oracle-portrait', 'player-tile-picked')).toBe(
      '/oracle-portrait.webp',
    );
    expect(selectAssetUrl(state, 'minimap-frame', 'mirrored')).toBe('/minimap-frame.webp');
  });

  it('has no URL once its group is released', () => {
    const released = assetsSlice.reducer(
      loaded,
      groupUrlsChanged({ group: 'selection', urls: {}, boxes: {} }),
    );
    expect(selectAssetUrl({ assets: released }, 'oracle-portrait', 'ally-tile')).toBeNull();
    expect(selectAssetUrl({ assets: released }, 'minimap-frame')).toBe('/minimap-frame.webp');
  });

  it("gives a file's draw box from any loaded group, by id or id@rendition", () => {
    const state = { assets: loaded };
    expect(selectAssetBox(state, 'oracle-portrait', 'ally-tile')).toBe(PORTRAIT_TILE);
    expect(selectAssetBox(state, 'minimap-frame')).toBe(FRAME);
  });

  it('has no box before the group loads, for a null id, after release, or for a file without one', () => {
    const released = assetsSlice.reducer(
      loaded,
      groupUrlsChanged({ group: 'selection', urls: {}, boxes: {} }),
    );
    expect(selectAssetBox({ assets: assetsSlice.getInitialState() }, 'minimap-frame')).toBeNull();
    expect(selectAssetBox({ assets: loaded }, null)).toBeNull();
    expect(selectAssetBox({ assets: released }, 'oracle-portrait', 'ally-tile')).toBeNull();
    expect(selectAssetBox({ assets: released }, 'minimap-frame')).toBe(FRAME);
    expect(selectAssetBox({ assets: loaded }, 'oracle-portrait')).toBeNull();
  });

  it("never lends a rendition its asset's box, nor an asset its rendition's", () => {
    const state = { assets: loaded };
    expect(selectAssetUrl(state, 'minimap-frame', 'mirrored')).toBe('/minimap-frame.webp');
    expect(selectAssetBox(state, 'minimap-frame', 'mirrored')).toBeNull();
    expect(selectAssetBox(state, 'oracle-portrait')).toBeNull();
  });

  it('stores the credits as given', () => {
    const credits: readonly CreditEntry[] = [
      {
        licenceId: 'mit-phosphor',
        work: 'Phosphor Icons',
        licenceName: 'MIT',
        notice: 'Copyright (c) 2023 Phosphor Icons',
        licenceText: 'Permission is hereby granted',
        assets: [{ assetId: 'icon-placeholder-atom', source: 'Phosphor Atom' }],
      },
    ];
    const assets = assetsSlice.reducer(undefined, creditsLoaded(credits));
    expect(selectCredits({ assets: assetsSlice.getInitialState() })).toEqual([]);
    expect(selectCredits({ assets })).toBe(credits);
  });
});
