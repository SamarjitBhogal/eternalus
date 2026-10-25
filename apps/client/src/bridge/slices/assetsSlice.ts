import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AssetId, RasterBox, RenditionKey } from '../catalogue.types';
import type { AssetGroup, AssetUrlKey, AssetUrls, CreditEntry } from '../events';

/** One value per URL key, for each asset group. */
type ByGroup<T> = Readonly<Record<AssetGroup, Readonly<Record<AssetUrlKey, T>>>>;

/** Loaded image URLs and draw boxes by asset group, and the credits generated from the manifest. */
type AssetsSliceState = {
  readonly urlsByGroup: ByGroup<string>;
  readonly boxesByGroup: ByGroup<RasterBox>;
  readonly credits: readonly CreditEntry[];
};

/** Every group, nothing loaded. */
const NO_GROUPS: ByGroup<never> = {
  boot: {},
  selection: {},
  'selection-primary': {},
  'selection-alternate': {},
  'selection-raster': {},
  'selection-primary-raster': {},
  match: {},
};

const initialState: AssetsSliceState = {
  urlsByGroup: NO_GROUPS,
  boxesByGroup: NO_GROUPS,
  credits: [],
};

/** The value stored under `key` in any loaded group, or `null`. */
function inAnyGroup<T>(byGroup: ByGroup<T>, key: AssetUrlKey): T | null {
  for (const values of Object.values(byGroup)) {
    const value = values[key];
    if (value !== undefined) return value;
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
      boxesByGroup: { ...state.boxesByGroup, [action.payload.group]: action.payload.boxes },
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
      const renditionUrl =
        rendition === undefined ? null : inAnyGroup(state.urlsByGroup, `${id}@${rendition}`);
      return renditionUrl ?? inAnyGroup(state.urlsByGroup, id);
    },
    /**
     * The draw box of `id`'s file (with a `rendition`, of that rendition's own file) once its
     * group has loaded; `null` before, for a `null` id, and for a file that declares none. Unlike
     * the URL there is no fallback: a box belongs to one file, so the caller draws live art.
     */
    selectAssetBox: (state, id: AssetId | null, rendition?: RenditionKey): RasterBox | null =>
      id === null
        ? null
        : inAnyGroup(state.boxesByGroup, rendition === undefined ? id : `${id}@${rendition}`),
    selectCredits: (state) => state.credits,
  },
});
