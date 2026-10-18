import { loadDisplayContent } from '@eternalus/core';

import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import { buildDisplayCatalogue } from './buildDisplayCatalogue';
import type { CatalogueSource } from './CatalogueSource.types';
import type { DisplayOverrides } from './CataloguePresentation.types';
import { CATALOGUE_PRESENTATION } from './screenPresentation';

/** No override: the content values stand. */
export const NO_DISPLAY_OVERRIDES: DisplayOverrides = { effectsRenderer: null };

/**
 * The shipped catalogue: core display content (validated by `loadDisplayContent`) joined with the
 * client presentation, its asset ids checked against `ASSET_MANIFEST`, with developer overrides
 * applied (`main.tsx` passes `readDeveloperFlags(location.search).displayOverrides`).
 */
export function createCoreCatalogue(overrides: DisplayOverrides): CatalogueSource {
  return {
    load: () =>
      buildDisplayCatalogue({
        content: loadDisplayContent(),
        presentation: CATALOGUE_PRESENTATION,
        knownAssetIds: new Set(ASSET_MANIFEST.assets.map((entry) => entry.id)),
        overrides,
      }),
  };
}

/** The shipped catalogue with no override (tests and the harness). */
export const coreCatalogue: CatalogueSource = createCoreCatalogue(NO_DISPLAY_OVERRIDES);
