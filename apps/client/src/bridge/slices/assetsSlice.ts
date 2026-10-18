import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AssetId, RenditionKey } from '../catalogue.types';
import type { AssetGroup, AssetUrlKey, AssetUrls, CreditEntry } from '../events';

/** Loaded image URLs by asset group, and the credits generated from the manifest. */
type AssetsSliceState = {
  readonly urlsByGroup: Readonly<Record<AssetGroup, Readonly<Record<AssetUrlKey, string>>>>;
  readonly credits: readonly CreditEntry[];
};

const initialState: AssetsSliceState = {
  urlsByGroup: {
    boot: {},
    selection: {},
    'selection-primary': {},
    'selection-alternate': {},
    'selection-raster': {},
    'selection-primary-raster': {},
    match: {},
  },
  credits: [],
};

/** The URL stored under `key` in any loaded group, or `null`. */
function urlIn(state: AssetsSliceState, key: AssetUrlKey): string | null {
  for (const urls of Object.values(state.urlsByGroup)) {
    const url = urls[key];
    if (url !== undefined) return url;
  }
  return null;
}

/** Mirror of the ResourceController's loaded groups, fed by `asset-urls` and `credits`. */
export const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    // Payloads are readonly and stored as given (PR1-21), so the reducers return new state.
    groupUrlsChanged: (state, action: PayloadAction<AssetUrls>) => ({
      ...state,
      urlsByGroup: { ...state.urlsByGroup, [action.payload.group]: action.payload.urls },
    }),
    creditsLoaded: (state, action: PayloadAction<readonly CreditEntry[]>) => ({
      ...state,
      credits: action.payload,
    }),
  },
  selectors: {
    /**
     * The URL of `id` once its group has loaded, `null` before (the view draws its placeholder).
     * With a `rendition`, its own file (`id@rendition`) wins; a missing rendition falls back to
     * the asset's file. Every group is searched.
     */
    selectAssetUrl: (state, id: AssetId | null, rendition?: RenditionKey): string | null => {
      if (id === null) return null;
      const renditionUrl = rendition === undefined ? null : urlIn(state, `${id}@${rendition}`);
      return renditionUrl ?? urlIn(state, id);
    },
    selectCredits: (state) => state.credits,
  },
});
