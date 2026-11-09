import { BIOME_REGIONS } from '../content/maps/biomeScenery';
import type { Vec2 } from '../utils/geometry.types';

/** Reads only sketch-space presentation bounds, never simulation terrain. */
export const sceneryBiomeAt = (point: Vec2): keyof typeof BIOME_REGIONS | undefined => {
  for (const [kind, region] of Object.entries(BIOME_REGIONS)) {
    if (((point.x - region.x) / region.rx) ** 2 + ((point.y - region.y) / region.ry) ** 2 <= 1)
      return kind as keyof typeof BIOME_REGIONS;
  }
  return undefined;
};
