import type { AssetId } from '../../bridge/catalogue.types';
import type { FramePoint, RasterBox } from './legendSelectLayout.types';

/** A class card plate (R1 step 2): its draw box and the origin of the overlay stroke it was cut for. */
export type ClassCardPlate = {
  /** Frame px, from the WP-ASSETS placement table (the only source of raster positions, §5.13). */
  readonly box: RasterBox;
  /** The inner GLASS overlay node's origin (62:177 …), whose 1 px stroke is drawn live (OD-1). */
  readonly overlayOrigin: FramePoint;
};

/**
 * Each card plate of 62:125 at its Figma slot: drawn at its own pixel size only where its box is
 * the card's art box (`ClassSelectCard`), else the art is live (cover mode). Overlay origins
 * from C§4.11 (62:177 0.86 px right of its art, 62:176 aligned, 62:179 1.08 px, 62:178 0.62 px).
 */
export const CLASS_CARD_PLATES: Readonly<Record<AssetId, ClassCardPlate>> = {
  // 62:164 + 62:177, Legionnaire idle.
  'warrior-card-plate-idle': {
    box: { left: 524, top: 277, width: 246, height: 525 },
    overlayOrigin: { x: 525.039, y: 277.055 },
  },
  // 62:159 + 62:176, Sentinel idle.
  'sentinel-card-plate-idle': {
    box: { left: 825, top: 277, width: 246, height: 525 },
    overlayOrigin: { x: 825.18, y: 277.008 },
  },
  // 62:154 + 62:178, Magus picked (the Figma state).
  'magus-card-plate-picked': {
    box: { left: 1111, top: 243, width: 277, height: 592 },
    overlayOrigin: { x: 1111.856, y: 243.696 },
  },
  // 62:149 + 62:179, Harbinger idle.
  'flying-card-plate-idle': {
    box: { left: 1427, top: 277, width: 246, height: 525 },
    overlayOrigin: { x: 1428.257, y: 277.055 },
  },
};

/** How far a plate's integer box may sit from the art origin of the card drawing it (its floor). */
export const PLATE_BOX_TOLERANCE = 1;
