import { createSelector } from '@reduxjs/toolkit';

import type { RenditionKey } from '../catalogue.types';
import type { HudSide } from '../hud.types';
import { assetsSlice } from '../slices/assetsSlice';
import type { RootState } from '../store';
import { selectStructureStrip } from './selectStructureStrip';

/** The enemy strip's icons face the other way: the R1 renders of the Figma's mirrored nodes. */
const SIDE_RENDITION: Readonly<Record<HudSide, RenditionKey | undefined>> = {
  allied: undefined,
  enemy: 'mirrored',
};

/**
 * The icon URL of each tile of one strip, in `selectStructureStrip`'s tile order; `null` for an
 * icon whose file has not loaded. The enemy strip gets the `mirrored` renditions. Memoised per side
 * on the tiles and the loaded assets (TAP-07), so a clock tick returns the same array.
 */
export const selectStructureIconUrls = createSelector(
  [
    selectStructureStrip,
    (state: RootState) => state.assets,
    (_state: RootState, side: HudSide) => side,
  ],
  (tiles, assets, side): readonly (string | null)[] =>
    tiles.map((tile) =>
      assetsSlice.selectors.selectAssetUrl({ assets }, tile.iconAssetId, SIDE_RENDITION[side]),
    ),
);
