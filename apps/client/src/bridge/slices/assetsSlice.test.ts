import { describe, expect, it } from 'vitest';

import type { CreditEntry } from '../events';
import { assetsSlice } from './assetsSlice';

const { groupUrlsChanged, creditsLoaded } = assetsSlice.actions;
const { selectAssetUrl, selectCredits } = assetsSlice.selectors;

const loaded = assetsSlice.reducer(
  assetsSlice.reducer(
    undefined,
    groupUrlsChanged({
      group: 'selection',
      urls: {
        'oracle-portrait': '/oracle-portrait.webp',
        'oracle-portrait@ally-tile': '/oracle-portrait@ally-tile.webp',
      },
    }),
  ),
  groupUrlsChanged({ group: 'match', urls: { 'minimap-frame': '/minimap-frame.webp' } }),
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
      groupUrlsChanged({ group: 'selection', urls: {} }),
    );
    expect(selectAssetUrl({ assets: released }, 'oracle-portrait', 'ally-tile')).toBeNull();
    expect(selectAssetUrl({ assets: released }, 'minimap-frame')).toBe('/minimap-frame.webp');
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
