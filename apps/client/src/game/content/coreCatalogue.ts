import { loadDisplayContent } from '@eternalus/core';

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
 * The shipped catalogue: core display content (validated by `loadDisplayContent`) joined with the
 * client presentation, its asset ids checked against `knownAssetIds` and its drawn statuses against
 * core's, with developer overrides applied. `main.tsx`, the composition root, passes its config's
 * tick rate, the asset manifest's ids, the status cue registry's ids and
 * `readDeveloperFlags(location.search).displayOverrides`; this module reads no data/ facade and
 * imports no view.
 */
export function createCoreCatalogue(inputs: {
  /** Ticks per second (`GameConfig.tickRate`): core loads the ability strategies' tuning at it. */
  readonly tickRate: number;
  readonly knownAssetIds: ReadonlySet<AssetId>;
  /** The statuses the canvas draws a cue for (`createDefaultStatusCueRegistry().statusIds`). */
  readonly drawnStatusIds: readonly string[];
  readonly overrides: DisplayOverrides;
}): CatalogueSource {
  return {
    load: () =>
      buildDisplayCatalogue({
        content: loadDisplayContent(inputs.tickRate),
        presentation: CATALOGUE_PRESENTATION,
        knownAssetIds: inputs.knownAssetIds,
        drawnStatusIds: inputs.drawnStatusIds,
        overrides: inputs.overrides,
      }),
  };
}
