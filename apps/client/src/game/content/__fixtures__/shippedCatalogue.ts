/**
 * Test support: the shipped catalogue as `main.tsx` builds it, its asset ids checked against
 * `ASSET_MANIFEST`. Imported only by tests and the visual harness, never by a module `main.tsx`
 * reaches (the composition root passes the manifest's ids itself).
 */
import { ASSET_MANIFEST } from '../../../data/resources/AssetManifest';
import type { CatalogueSource } from '../CatalogueSource.types';
import type { DisplayOverrides } from '../CataloguePresentation.types';
import { createCoreCatalogue, NO_DISPLAY_OVERRIDES } from '../coreCatalogue';

/** The shipped catalogue with `overrides` (none by default). */
export function shippedCatalogue(
  overrides: DisplayOverrides = NO_DISPLAY_OVERRIDES,
): CatalogueSource {
  return createCoreCatalogue({
    knownAssetIds: new Set(ASSET_MANIFEST.assets.map((entry) => entry.id)),
    overrides,
  });
}
