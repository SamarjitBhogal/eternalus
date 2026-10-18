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

/**
 * Loads the shipped display content and validates it once: the legends with
 * `createDefaultContentRules()`, then the specs with `createLegendSpecRules(LEGEND_CLASSES)`, each
 * through a `ContentValidator` (04 §5, DEC-22). The display sibling of `loadDefaultContent` (02 §6).
 *
 * @throws ContentValidationError listing every broken rule of the first catalogue that fails (each
 *   catalogue reports all its own problems at once; the specs are not checked while the legends
 *   fail).
 */
export const loadDisplayContent = (): DisplayContent => {
  new ContentValidator(createDefaultContentRules()).validate(LEGEND_CLASSES);
  new ContentValidator(createLegendSpecRules(LEGEND_CLASSES)).validate(LEGEND_SPECS);

  return {
    legends: LEGEND_CLASSES.all(),
    specs: LEGEND_SPECS.all(),
    mapFeatures: Object.values(MAP_FEATURE_DEFINITIONS).map(({ id, kind, displayName }) => ({
      id,
      kind,
      displayName,
    })),
  };
};
