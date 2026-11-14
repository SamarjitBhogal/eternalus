import catalystMiniLegendMini from '../../assets/selection/legends/catalyst-mini@legend-mini.webp';
import catalystMiniLegendMini2x from '../../assets/selection/legends/catalyst-mini@legend-mini@2x.webp';
import necromancerMiniLegendMini from '../../assets/selection/legends/necromancer-mini@legend-mini.webp';
import necromancerMiniLegendMini2x from '../../assets/selection/legends/necromancer-mini@legend-mini@2x.webp';
import oracleMiniLegendMini from '../../assets/selection/legends/oracle-mini@legend-mini.webp';
import oracleMiniLegendMini2x from '../../assets/selection/legends/oracle-mini@legend-mini@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * Part of the `selection` group: the Legend mini portraits of the class panel's Legends strip,
 * which the primary class step and both layouts' View Details draw (DEC-109).
 */
export const SELECTION_LEGEND_STRIP_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'catalyst-mini',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: catalystMiniLegendMini,
      bytes: 16074,
      hash: 'a096d9d5bfcfc7f1abb2c7b019b4e930e70260d4bb1459887ecb3a1d2e877ca7',
    },
    file2x: {
      url: catalystMiniLegendMini2x,
      bytes: 52256,
      hash: '2410b3e49f7f26e337110986b9805ac46d9bbf8ad6d87f8701d0ff7b3f39c87a',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. legend-mini = 72:803 (Figma: Veridan) cropped to (70, 803, 102, 137) (fractional box (70.5, 803.47, 101, 136.03) baked), nothing removed',
    renditions: {
      'legend-mini': {
        file: {
          url: catalystMiniLegendMini,
          bytes: 16074,
          hash: 'a096d9d5bfcfc7f1abb2c7b019b4e930e70260d4bb1459887ecb3a1d2e877ca7',
        },
        file2x: {
          url: catalystMiniLegendMini2x,
          bytes: 52256,
          hash: '2410b3e49f7f26e337110986b9805ac46d9bbf8ad6d87f8701d0ff7b3f39c87a',
        },
        box: { left: 70, top: 803, width: 102, height: 137 },
      },
    },
  },
  {
    id: 'necromancer-mini',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: necromancerMiniLegendMini,
      bytes: 15438,
      hash: 'ca1e49f032f5eaad2bd51cd52c6ced0195d8b88d09dfc99268070cd2d81e283d',
    },
    file2x: {
      url: necromancerMiniLegendMini2x,
      bytes: 48684,
      hash: '1fc17d7515484859857bac81a69389caf7bfc1f90f7ca325f6de81615abd1931',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. legend-mini = 72:797 (Figma: Avedrin) cropped to (341, 803, 102, 137) (fractional box (341.5, 803.47, 101, 136.03) baked), nothing removed',
    renditions: {
      'legend-mini': {
        file: {
          url: necromancerMiniLegendMini,
          bytes: 15438,
          hash: 'ca1e49f032f5eaad2bd51cd52c6ced0195d8b88d09dfc99268070cd2d81e283d',
        },
        file2x: {
          url: necromancerMiniLegendMini2x,
          bytes: 48684,
          hash: '1fc17d7515484859857bac81a69389caf7bfc1f90f7ca325f6de81615abd1931',
        },
        box: { left: 341, top: 803, width: 102, height: 137 },
      },
    },
  },
  {
    id: 'oracle-mini',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: oracleMiniLegendMini,
      bytes: 17994,
      hash: 'd843b69830f24aa0b9d9317e7ffdbb3344b7a0ee5897f378e30b31c362cd1284',
    },
    file2x: {
      url: oracleMiniLegendMini2x,
      bytes: 17436,
      hash: 'f256b7a96914c18a8d83153828b10a1994f361a7a543c4ba9706485a10b4e4bb',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. legend-mini = 72:791 (Figma: Elarion) cropped to (208, 804, 100, 135), nothing removed, 2x lossy q92 (alpha lossless)',
    renditions: {
      'legend-mini': {
        file: {
          url: oracleMiniLegendMini,
          bytes: 17994,
          hash: 'd843b69830f24aa0b9d9317e7ffdbb3344b7a0ee5897f378e30b31c362cd1284',
        },
        file2x: {
          url: oracleMiniLegendMini2x,
          bytes: 17436,
          hash: 'f256b7a96914c18a8d83153828b10a1994f361a7a543c4ba9706485a10b4e4bb',
        },
        box: { left: 208, top: 804, width: 100, height: 135 },
      },
    },
  },
];
