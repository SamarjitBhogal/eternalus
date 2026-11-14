import type { AssetManifestEntry } from './AssetManifest.types';
import { MATCH_PANEL_ASSETS } from './matchPanelAssets';
import { MATCH_STRIP_ASSETS } from './matchStripAssets';
import { MAGUS_SPRITE_ASSETS } from './magusSpriteAssets';
import { LEGEND_SPRITE_ASSETS } from './legendSpriteAssets';

/**
 * The `match` group: HUD art, loaded in `match-loading` and released after the match (13 §2). Its
 * entries sit in parts by what draws them.
 */
export const MATCH_ASSETS: readonly AssetManifestEntry[] = [
  ...MAGUS_SPRITE_ASSETS,
  ...LEGEND_SPRITE_ASSETS,
  ...MATCH_STRIP_ASSETS,
  ...MATCH_PANEL_ASSETS,
];
