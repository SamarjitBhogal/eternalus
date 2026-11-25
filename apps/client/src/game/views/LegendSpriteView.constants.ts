import { LEGEND_SPRITE_SHEETS } from '../LegendAnimation.constants';

/** The team ring under a drawn sprite, as a share of the sprite's width. */
// TUNE: placeholder look; no Figma frame draws a sprite's team ring
export const LEGEND_SPRITE_RING_SCALE = 0.55;

/** Each sheet's feet height by atlas id, read from `LEGEND_SPRITE_SHEETS`. */
export const GROUND_OFFSET_BY_ATLAS: ReadonlyMap<string, number> = new Map(
  Object.values(LEGEND_SPRITE_SHEETS).map(({ atlasId, groundOffset }) => [atlasId, groundOffset]),
);
