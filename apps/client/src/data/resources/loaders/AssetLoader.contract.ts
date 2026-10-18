import { describe, expect, it } from 'vitest';

import type { AssetManifestEntry } from '../AssetManifest.types';
import type { AssetLoader } from './AssetLoader';

/**
 * What the contract needs from each adapter: the loader, an entry/url pair that loads, one that
 * fails, and a release probe.
 */
export type AssetLoaderHarness<Handle> = {
  readonly loader: AssetLoader<Handle>;
  readonly goodEntry: AssetManifestEntry;
  readonly goodUrl: string;
  readonly badEntry: AssetManifestEntry;
  readonly badUrl: string;
  /** Whether `handle` is still held by the platform (e.g. a registered font face). */
  readonly isHeld: (handle: Handle) => boolean;
};

/**
 * The behaviour every `AssetLoader` shares (LSP; 02 §8, 17 R25): load resolves a handle; a failed
 * load or decode rejects; release frees the handle; the loader's type matches its entries. Each
 * adapter's test calls it with a factory for a fresh harness.
 */
export function describeAssetLoader<Handle>(
  name: string,
  createHarness: () => AssetLoaderHarness<Handle>,
): void {
  describe(`${name} AssetLoader contract`, () => {
    it('resolves a held handle for a file that loads', async () => {
      const harness = createHarness();

      const handle = await harness.loader.load(harness.goodEntry, harness.goodUrl);

      expect(harness.isHeld(handle)).toBe(true);
    });

    it('rejects for a file that fails to load or decode', async () => {
      const harness = createHarness();

      await expect(harness.loader.load(harness.badEntry, harness.badUrl)).rejects.toThrow();
    });

    it('frees the handle on release', async () => {
      const harness = createHarness();
      const handle = await harness.loader.load(harness.goodEntry, harness.goodUrl);

      harness.loader.release(handle);

      expect(harness.isHeld(handle)).toBe(false);
    });

    it('declares the type of the entries it loads', () => {
      const harness = createHarness();

      expect([harness.goodEntry.type, harness.badEntry.type]).toEqual([
        harness.loader.type,
        harness.loader.type,
      ]);
    });
  });
}
