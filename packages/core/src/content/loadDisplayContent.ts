import type { ContentCatalogue } from './ContentCatalogue';
import { createDefaultContentRules, createLegendSpecRules } from './defaultContentRules';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import { LEGEND_SPECS } from './legends/specs/legendSpecCatalogue';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import { MAP_FEATURE_DEFINITIONS } from './maps/mapFeatureDefinitions';
import type { MapFeatureKind } from './maps/maps.types';
import { ContentValidator } from './validation/ContentValidator';

/** Display data the client's selection screens and HUD show (read-only definitions). */
export type DisplayContent = {
  readonly legends: readonly LegendDefinition[];
  readonly specs: readonly LegendSpecDefinition[];
  readonly mapFeatures: readonly {
    readonly id: string;
    readonly kind: MapFeatureKind;
    readonly displayName: string | null;
  }[];
};

/** The catalogues `loadDisplayContent` validates and returns; each defaults to the shipped one. */
type DisplayCatalogues = {
  readonly legends?: ContentCatalogue<LegendDefinition>;
  readonly specs?: ContentCatalogue<LegendSpecDefinition>;
};

/**
 * Loads the display content and validates it once: the legends with `createDefaultContentRules()`,
 * then the specs with `createLegendSpecRules(legends)`, each through a `ContentValidator` (04 §5,
 * DEC-22). The display sibling of `loadDefaultContent` (02 §6).
 *
 * @param catalogues - The catalogues to load; each one left out is the shipped one.
 * @throws ContentValidationError listing every broken rule of the first catalogue that fails (each
 *   catalogue reports all its own problems at once; the specs are not checked while the legends
 *   fail).
 */
export const loadDisplayContent = ({
  legends = LEGEND_CLASSES,
  specs = LEGEND_SPECS,
}: DisplayCatalogues = {}): DisplayContent => {
  new ContentValidator(createDefaultContentRules()).validate(legends);
  new ContentValidator(createLegendSpecRules(legends)).validate(specs);

  return {
    legends: legends.all(),
    specs: specs.all(),
    mapFeatures: Object.values(MAP_FEATURE_DEFINITIONS).map(({ id, kind, displayName }) => ({
      id,
      kind,
      displayName,
    })),
  };
};
