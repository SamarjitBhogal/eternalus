/**
 * Test support: the sprite sheets that the match factory passes for a set of sub-classes
 * (`matchLegendSheets`; DEC-378 (2)). Imported only by tests.
 */
import { LEGEND_SPRITE_SHEETS } from '../legendSpriteSheets';
import type { LegendSpriteSheet } from '../legendSpriteSheets.types';

/** The shipped sheets of `specIds`, by sub-class id. An id without a sheet adds nothing. */
export const sheetsFor = (...specIds: readonly string[]): ReadonlyMap<string, LegendSpriteSheet> =>
  new Map(Object.entries(LEGEND_SPRITE_SHEETS).filter(([specId]) => specIds.includes(specId)));
