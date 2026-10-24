import type { AssetId } from '../../bridge/catalogue.types';
import type { ChromeBox } from './GlowButton.types';

/**
 * The left brace of either button in a unit box (62:227 at 17.654 × 48.762, 58:322 at
 * 16.114 × 43.279: one shape), its point at the left; stroked 1 px, round caps.
 */
export const BRACE_UNIT_PATH =
  'M 1 0 L 0.82857143 0.031914894 L 0.54285714 0 L 0.54285714 0.31914894 L 0 0.5106383 ' +
  'L 0.54285714 0.64893617 L 0.54285714 0.9893617 L 0.82857143 0.95744681 L 1 1';

/**
 * The right brace (62:226, 58:275): the left one mirrored left to right, as Figma renders it
 * (select-class-braces.svg, lock-in-braces.svg). A 180° turn would put its point 1 px off, since
 * the point is not at mid-height.
 */
export const BRACE_MIRRORED_UNIT_PATH =
  'M 0 0 L 0.17142857 0.031914894 L 0.45714286 0 L 0.45714286 0.31914894 L 1 0.5106383 ' +
  'L 0.45714286 0.64893617 L 0.45714286 0.9893617 L 0.17142857 0.95744681 L 0 1';

/**
 * Each chrome plate's full render-bounds box relative to its button root: the WP-ASSETS
 * placement table's frame box minus the skin's root origin (the only source of raster positions,
 * §5.13). The box equals the file's pixel size and is never cropped (FID-R3-01); a chrome id with
 * no box here is not drawn (the live chrome shows instead).
 */
export const CHROME_PLATE_BOXES: Readonly<Record<AssetId, ChromeBox>> = {
  // select-class-chrome (740, 858) 439 × 163 − the Select Class root (788, 908), 62:222.
  'select-class-chrome': { left: -48, top: -50, width: 439, height: 163 },
  // lock-in-chrome (754, 890) 411 × 156 − the LOCK IN root (803, 940), 58:277.
  'lock-in-chrome': { left: -49, top: -50, width: 411, height: 156 },
};
