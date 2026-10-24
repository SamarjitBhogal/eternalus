import { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_LEVEL_CURVE } from './levelCurves';
import type { LevelCurveDefinition } from './progression.types';

/** Every level curve as authored; `loadLevelCurves` validates them. A new curve is a line here. */
export const LEVEL_CURVE_CATALOGUE = new ContentCatalogue<LevelCurveDefinition>([
  LEGEND_LEVEL_CURVE,
]);
