import type { DisplayContent } from '@eternalus/core';

import type { AssetId } from '../../bridge/catalogue.types';
import { buildDisplayCatalogue } from './buildDisplayCatalogue';
import type { CatalogueSource } from './CatalogueSource.types';
import type { DisplayOverrides } from './CataloguePresentation.types';
import { CATALOGUE_PRESENTATION } from './screenPresentation';

/** No override: the content values stand. */
export const NO_DISPLAY_OVERRIDES: DisplayOverrides = {
  effectsRenderer: null,
  uiEnhancements: null,
};

/**
 * The shipped catalogue: core display content (the one `loadDisplayContent` load, which
 * `main.tsx` also builds the loadout options from) joined with the
 * client presentation, its asset ids checked against `knownAssetIds`, with developer overrides
 * applied. `main.tsx`, the composition root, passes the asset manifest's ids and
 * `readDeveloperFlags(location.search).displayOverrides`; this module reads no data/ facade.
 */
export function createCoreCatalogue(inputs: {
  readonly content: DisplayContent;
  readonly knownAssetIds: ReadonlySet<AssetId>;
  readonly overrides: DisplayOverrides;
}): CatalogueSource {
  return {
    load: () =>
      buildDisplayCatalogue({
        content: inputs.content,
        presentation: CATALOGUE_PRESENTATION,
        knownAssetIds: inputs.knownAssetIds,
        overrides: inputs.overrides,
      }),
  };
}
