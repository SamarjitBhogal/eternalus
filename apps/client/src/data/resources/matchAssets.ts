import type { AssetManifestEntry } from './AssetManifest.types';
import { MATCH_PANEL_ASSETS } from './matchPanelAssets';
import { MATCH_STRIP_ASSETS } from './matchStripAssets';

/**
 * The `match` group: HUD art, loaded in `match-loading` and released after the match (13 §2). Its
 * entries sit in parts by what draws them.
 */
export const MATCH_ASSETS: readonly AssetManifestEntry[] = [
  ...MATCH_STRIP_ASSETS,
  ...MATCH_PANEL_ASSETS,
];
