import type { AssetManifestEntry, AssetType } from '../AssetManifest.types';

/** What a `FakeAssetLoader` load resolves to: a fresh object per load, naming its file. */
export type FakeAssetHandle = { readonly url: string };

/** One `load` call, in call order. */
export type FakeLoadCall = { readonly entry: AssetManifestEntry; readonly url: string };

/** How a `FakeAssetLoader` behaves; every field is optional. */
export type FakeAssetLoaderOptions = {
  /** The entry type it loads (default `'ui-image'`). */
  readonly type?: AssetType;
  /** Files whose loads reject when they settle. */
  readonly failingUrls?: readonly string[];
  /** Settle each load at once instead of waiting for `resolveAll()` (default `false`). */
  readonly shouldSettleAtOnce?: boolean;
};
