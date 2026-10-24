import type { AssetId } from '../../bridge/catalogue.types';
import type { RasterBox } from './legendSelectLayout.types';

/**
 * Each class row plate's full render-bounds box in frame px, from the WP-ASSETS placement table
 * (the only source of raster positions, §5.13): drawn uncropped at its own pixel size
 * (FID-R3-01, I-45). A plate id with no box here is not drawn, and the live halo shows (I-69).
 */
export const CLASS_ROW_PLATE_BOXES: Readonly<Record<AssetId, RasterBox>> = {
  // 62:200 over everything beneath it, Magus picked: render bounds (491, 198.87) 1215.57 × 681.95
  // rounded outward; alpha 0 in the three holes over the subtitle and the panel's text ends.
  'class-row-plate-magus': { left: 491, top: 198, width: 1216, height: 683 },
};
