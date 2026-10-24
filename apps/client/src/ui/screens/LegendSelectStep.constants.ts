import type { AssetId } from '../../bridge/catalogue.types';
import type { RasterBox } from './legendSelectLayout.types';

/**
 * Each Legend row plate's full render-bounds box in frame px, from the WP-ASSETS placement table
 * (the only source of raster positions, §5.13): drawn uncropped at its own pixel size
 * (FID-R3-01, I-45). A plate id with no box here is not drawn, and the live halo shows (I-69).
 */
export const ROW_PLATE_BOXES: Readonly<Record<AssetId, RasterBox>> = {
  // 61:3 render bounds (459, 65) 1001.65 × 935.23 rounded outward, oracle picked.
  'oracle-row-plate': { left: 459, top: 65, width: 1002, height: 936 },
};
