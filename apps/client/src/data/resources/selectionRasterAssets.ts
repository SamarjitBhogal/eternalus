import lockInChrome from '../../assets/selection-raster/chrome/lock-in-chrome.webp';
import lockInChrome2x from '../../assets/selection-raster/chrome/lock-in-chrome@2x.webp';
import oracleRowPlate from '../../assets/selection-raster/legends/oracle-row-plate.webp';
import oracleRowPlate2x from '../../assets/selection-raster/legends/oracle-row-plate@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * The `selection-raster` group: the Legend step's plates, loaded only with the `figma-raster`
 * effects renderer (I-47, DEC-54).
 */
export const SELECTION_RASTER_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'lock-in-chrome',
    type: 'ui-image',
    group: 'selection-raster',
    file: {
      url: lockInChrome,
      bytes: 54766,
      hash: '619c1e16777d56f1e75716bb2cb1a9d1ecf996e9418d6c1656a98d52155c557b',
    },
    file2x: {
      url: lockInChrome2x,
      bytes: 12736,
      hash: '6ff9e81b6930b5a3357c07e827a2ec916d3020d0c087479a6305b375481f2135',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-P2b-lockin: composite over the original frame fill and backdrop with the oracle-picked row beneath; every layer above 58:277 and the label 58:276 hidden (r1-log W15); opaque crop; 1x lossless WebP. file = 58:277 with 58:276 hidden (render bounds 754.84, 890, 409.4 × 155.25) cropped to (754, 890, 411, 156), nothing removed, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'oracle-row-plate',
    type: 'ui-image',
    group: 'selection-raster',
    file: {
      url: oracleRowPlate,
      bytes: 812256,
      hash: '0158ebba78aa5ca23a2663d1563117fbf8c1e0039de5deb5766f4f50eeb9292d',
    },
    file2x: {
      url: oracleRowPlate2x,
      bytes: 231062,
      hash: 'e4ac9245f348f51daa24c0b6f680d9a9064a98ee1e384e9bc6df10d74f725878',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-P2a-rowplate: composite over the original frame fill and backdrop; side cards 55:268/55:269, LOCK IN 58:277, R5-R10 and the picked card text hidden (r1-log W13); opaque crop; 1x lossless WebP. file = 61:3 render bounds (459, 65, 1001.65 × 935.23): R0–R3 + 58:351, 55:256, 58:354, 55:255 with stroke and glows cropped to (459, 65, 1002, 936), nothing removed, 2x lossy q92 (alpha lossless)',
  },
];
