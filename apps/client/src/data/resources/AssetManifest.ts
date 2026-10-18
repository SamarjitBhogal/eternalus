import type { AssetManifest } from './AssetManifest.types';
import { BOOT_ASSETS } from './bootAssets';
import { MATCH_ASSETS } from './matchAssets';
import { SELECTION_ALTERNATE_ASSETS } from './selectionAlternateAssets';
import { SELECTION_ASSETS } from './selectionAssets';
import { SELECTION_PRIMARY_ASSETS } from './selectionPrimaryAssets';
import { SELECTION_PRIMARY_RASTER_ASSETS } from './selectionPrimaryRasterAssets';
import { SELECTION_RASTER_ASSETS } from './selectionRasterAssets';

/**
 * The asset list: the only one (02 §9, 14 §11). Each group's entries sit in that group's file
 * beside this one (DV-131); adding an asset is a line in its group's file. Every file under
 * `src/assets/` is an entry here, except the licence texts `assetLicences.ts` reads.
 */
export const ASSET_MANIFEST: AssetManifest = {
  version: '1',
  assets: [
    ...BOOT_ASSETS,
    ...SELECTION_ASSETS,
    ...SELECTION_PRIMARY_ASSETS,
    ...SELECTION_ALTERNATE_ASSETS,
    ...SELECTION_RASTER_ASSETS,
    ...SELECTION_PRIMARY_RASTER_ASSETS,
    ...MATCH_ASSETS,
  ],
};
