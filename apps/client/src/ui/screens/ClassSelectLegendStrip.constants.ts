import type { AssetId } from '../../bridge/catalogue.types';
import type { RasterBox } from './legendSelectLayout.types';

/** The top of every mini card's outer frame (72:801, 72:808, 72:806), frame px. */
export const MINI_TOP = 801;

/**
 * The left edge of each slot's 105 × 140 outer frame, frame px: the Figma's three slots (pitch
 * 137 then 134); fewer Legends fill them from the left, more are not shown.
 */
export const MINI_SLOT_LEFTS: readonly number[] = [68, 205, 339];

/**
 * Each `legend-mini` rendition's draw box in frame px, from the WP-ASSETS placement table: the
 * file bakes its portrait's fractional origin at its Figma slot (I-45), so it is drawn only there.
 */
export const MINI_ART_BOXES: Readonly<Record<AssetId, RasterBox>> = {
  // 72:803 slot 0 (fractional box 70.5, 803.47 101 × 136.03).
  'catalyst-mini': { left: 70, top: 803, width: 102, height: 137 },
  // 72:791 slot 1, no stroke.
  'oracle-mini': { left: 208, top: 804, width: 100, height: 135 },
  // 72:797 slot 2 (fractional box 341.5, 803.47 101 × 136.03).
  'necromancer-mini': { left: 341, top: 803, width: 102, height: 137 },
};
