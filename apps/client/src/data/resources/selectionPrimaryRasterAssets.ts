import classRowPlateMagus from '../../assets/selection-primary-raster/classes/class-row-plate-magus.webp';
import classRowPlateMagus2x from '../../assets/selection-primary-raster/classes/class-row-plate-magus@2x.webp';
import flyingCardPlateIdle from '../../assets/selection-primary-raster/classes/flying-card-plate-idle.webp';
import flyingCardPlateIdle2x from '../../assets/selection-primary-raster/classes/flying-card-plate-idle@2x.webp';
import magusCardPlatePicked from '../../assets/selection-primary-raster/classes/magus-card-plate-picked.webp';
import magusCardPlatePicked2x from '../../assets/selection-primary-raster/classes/magus-card-plate-picked@2x.webp';
import selectClassChrome from '../../assets/selection-primary-raster/chrome/select-class-chrome.webp';
import selectClassChrome2x from '../../assets/selection-primary-raster/chrome/select-class-chrome@2x.webp';
import sentinelCardPlateIdle from '../../assets/selection-primary-raster/classes/sentinel-card-plate-idle.webp';
import sentinelCardPlateIdle2x from '../../assets/selection-primary-raster/classes/sentinel-card-plate-idle@2x.webp';
import warriorCardPlateIdle from '../../assets/selection-primary-raster/classes/warrior-card-plate-idle.webp';
import warriorCardPlateIdle2x from '../../assets/selection-primary-raster/classes/warrior-card-plate-idle@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * The `selection-primary-raster` group: the class step's plates, loaded only with the `figma-
 * raster` effects renderer (I-47, DEC-54).
 */
export const SELECTION_PRIMARY_RASTER_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'class-row-plate-magus',
    type: 'ui-image',
    group: 'selection-primary-raster',
    file: {
      url: classRowPlateMagus,
      bytes: 567452,
      hash: 'a452e92d7821fa557e3a1d0f96085c4977feb0cd9d0cfd6b648e71625ac41347',
    },
    file2x: {
      url: classRowPlateMagus2x,
      bytes: 98470,
      hash: '721961f93c097cb66b609e4f197fe0fbca0aa5a610e1e2a70dcc2efa82a34360',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P2b-rowplate: composite over the original frame fill and backdrop; crisp cards 62:147/152/157/162 and all text but the label 62:228 and the 62:200 halo names hidden (r1-log W4); opaque crop; 1x lossless WebP. file = 62:200 over everything beneath it (render bounds 491, 198.87, 1215.57 × 681.95) cropped to (491, 198, 1216, 683), nothing removed, alpha 0 in the three holes (7434 px), 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'flying-card-plate-idle',
    type: 'ui-image',
    group: 'selection-primary-raster',
    file: {
      url: flyingCardPlateIdle,
      bytes: 85496,
      hash: 'c8e570a02bf5600bf8f850cb1140a226f095f7a68b502f05ad854893c07aec4f',
    },
    file2x: {
      url: flyingCardPlateIdle2x,
      bytes: 26948,
      hash: '5294b7dfe62dacc7270f17f5b44ca7217b847bdd59db8e41ae29cce2b0f32606',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P2a-cardplates: GLASS composite over the original frame fill and backdrop, text hidden (r1-log W3); opaque crop; alpha 1 inside the art arch, 0 outside it and on its boundary ring (coverage from cs-P1-nonglass); 1x lossless WebP. file = 62:149 + 62:179 cropped to (1427, 277, 246, 525) (fractional box (1427.18, 277.01, 244.97, 524.15) baked), removed: 1 px cream strokes of 62:149 and 62:179, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'magus-card-plate-picked',
    type: 'ui-image',
    group: 'selection-primary-raster',
    file: {
      url: magusCardPlatePicked,
      bytes: 114776,
      hash: '26f48c57a38bb992b325075e0b621d982a40990b19eef56c02c3474b4d89bb6a',
    },
    file2x: {
      url: magusCardPlatePicked2x,
      bytes: 43010,
      hash: 'c820e3e840e77e2ec80834098be0d16d2031523f161535ed69901af11e367931',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P2a-cardplates: GLASS composite over the original frame fill and backdrop, text hidden (r1-log W3); opaque crop; alpha 1 inside the art arch, 0 outside it and on its boundary ring (coverage from cs-P1-nonglass); 1x lossless WebP. file = 62:154 + 62:178 cropped to (1111, 243, 277, 592) (fractional box (1111.24, 243.64, 276.03, 590.62) baked), removed: 1 px cream strokes of 62:154 and 62:178, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'select-class-chrome',
    type: 'ui-image',
    group: 'selection-primary-raster',
    file: {
      url: selectClassChrome,
      bytes: 61908,
      hash: 'bcbc8a25a7490b9503e79ae351d760d83739da1ff97a25d333700dacf77eb6eb',
    },
    file2x: {
      url: selectClassChrome2x,
      bytes: 16688,
      hash: '2a4d24a699e058b1faaa73e4526e0ba3b172b672e631e4330e1a722d9cc4c93a',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P2c-chrome: composite over the original frame fill and backdrop; 62:146 (cards and halo) and the label 62:228 hidden (r1-log W6); opaque crop; 1x lossless WebP. file = 62:222 with 62:228 hidden (render bounds 740.02, 858, 438.96 × 162.25) cropped to (740, 858, 439, 163), nothing removed, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'sentinel-card-plate-idle',
    type: 'ui-image',
    group: 'selection-primary-raster',
    file: {
      url: sentinelCardPlateIdle,
      bytes: 110552,
      hash: '57ff13c99c3648e01e0db53824d5a211d18f7c8f74f9edc5bb121dc2adae1f8e',
    },
    file2x: {
      url: sentinelCardPlateIdle2x,
      bytes: 53096,
      hash: '42a884e0bc6bea4f44688acecb807fbe1717781d3d2b4825dcbc28d619562510',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P2a-cardplates: GLASS composite over the original frame fill and backdrop, text hidden (r1-log W3); opaque crop; alpha 1 inside the art arch, 0 outside it and on its boundary ring (coverage from cs-P1-nonglass); 1x lossless WebP. file = 62:159 + 62:176 cropped to (825, 277, 246, 525) (fractional box (825.18, 277.01, 244.97, 524.15) baked), removed: 1 px cream strokes of 62:159 and 62:176, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'warrior-card-plate-idle',
    type: 'ui-image',
    group: 'selection-primary-raster',
    file: {
      url: warriorCardPlateIdle,
      bytes: 101476,
      hash: 'b29670699c69560dd41be9f3e4eba626276947455ef5eafc8c2f614490e2e26c',
    },
    file2x: {
      url: warriorCardPlateIdle2x,
      bytes: 43056,
      hash: '5d3455ccc3449deec97654ae739fd1c55e31e382a68ff46246678caacd2c0ccc',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P2a-cardplates: GLASS composite over the original frame fill and backdrop, text hidden (r1-log W3); opaque crop; alpha 1 inside the art arch, 0 outside it and on its boundary ring (coverage from cs-P1-nonglass); 1x lossless WebP. file = 62:164 + 62:177 cropped to (524, 277, 246, 525) (fractional box (524.18, 277.01, 244.97, 524.15) baked), removed: 1 px cream strokes of 62:164 and 62:177, 2x lossy q92 (alpha lossless)',
  },
];
