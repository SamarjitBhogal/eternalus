import type { AssetManifestEntry, AssetType } from '../AssetManifest.types';

/**
 * The loader port (14 §11 "one loader per asset type"; 02 §8). `ResourceController` sees only this
 * interface; `UiImageLoader` and `FontLoader` implement it for the browser, `FakeAssetLoader` for
 * tests, and every implementation passes `describeAssetLoader` (`AssetLoader.contract.ts`).
 */
export interface AssetLoader<Handle> {
  /** The type of the manifest entries this loader decodes. */
  readonly type: AssetType;
  /** Fetches and decodes `url`, one of `entry`'s files; rejects when it cannot be loaded. */
  load(entry: AssetManifestEntry, url: string): Promise<Handle>;
  /** Frees what `load` returned; the controller calls it when the entry's group is released. */
  release(handle: Handle): void;
}
