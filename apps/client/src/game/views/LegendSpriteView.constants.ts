import { LEGEND_ATLASES } from '../LegendAnimation.constants';

export const MAGUS_GROUND_OFFSET = 0.35; // TUNE: baseline of the existing Magus atlas.
export const REPACKED_GROUND_OFFSET = 9 / 128; // TUNE: transparent gutter in the repacked atlas.
export const MAGUS_ATLAS_IDS = new Set(
  Object.values(LEGEND_ATLASES)
    .filter((atlas) => atlas.usesMagusPoseLayout)
    .map(({ atlasId }) => atlasId),
);
export const RING_SCALE = 0.55; // TUNE: keep the faction ring under the sprite.
