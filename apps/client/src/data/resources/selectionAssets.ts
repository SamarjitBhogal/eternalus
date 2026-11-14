import type { AssetManifestEntry } from './AssetManifest.types';
import { SELECTION_CARD_ART_ASSETS } from './selectionCardArtAssets';
import { SELECTION_DETAIL_ASSETS } from './selectionDetailAssets';
import { SELECTION_LEGEND_STRIP_ASSETS } from './selectionLegendStripAssets';
import { SELECTION_PORTRAIT_ASSETS } from './selectionPortraitAssets';
import { SELECTION_SCREEN_ASSETS } from './selectionScreenAssets';

/**
 * The `selection` group: loaded in `loading` for both class-step layouts and the Legend step
 * (14 §14). Its entries sit in parts by what draws them.
 */
export const SELECTION_ASSETS: readonly AssetManifestEntry[] = [
  ...SELECTION_SCREEN_ASSETS,
  ...SELECTION_PORTRAIT_ASSETS,
  ...SELECTION_LEGEND_STRIP_ASSETS,
  ...SELECTION_CARD_ART_ASSETS,
  ...SELECTION_DETAIL_ASSETS,
];
