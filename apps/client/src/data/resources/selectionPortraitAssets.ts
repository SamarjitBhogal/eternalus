import catalystPortraitAllyTile from '../../assets/selection/legends/catalyst-portrait@ally-tile.webp';
import catalystPortraitAllyTile2x from '../../assets/selection/legends/catalyst-portrait@ally-tile@2x.webp';
import catalystPortraitPlayerTilePicked from '../../assets/selection/legends/catalyst-portrait@player-tile-picked.webp';
import catalystPortraitPlayerTilePicked2x from '../../assets/selection/legends/catalyst-portrait@player-tile-picked@2x.webp';
import legionnaireLegendPortraitAllyTile from '../../assets/selection/legends/legionnaire-legend-portrait@ally-tile.webp';
import legionnaireLegendPortraitAllyTile2x from '../../assets/selection/legends/legionnaire-legend-portrait@ally-tile@2x.webp';
import legionnaireLegendPortraitPlayerTilePicked from '../../assets/selection/legends/legionnaire-legend-portrait@player-tile-picked.webp';
import legionnaireLegendPortraitPlayerTilePicked2x from '../../assets/selection/legends/legionnaire-legend-portrait@player-tile-picked@2x.webp';
import necromancerPortraitAllyTile from '../../assets/selection/legends/necromancer-portrait@ally-tile.webp';
import necromancerPortraitAllyTile2x from '../../assets/selection/legends/necromancer-portrait@ally-tile@2x.webp';
import necromancerPortraitPlayerTilePicked from '../../assets/selection/legends/necromancer-portrait@player-tile-picked.webp';
import necromancerPortraitPlayerTilePicked2x from '../../assets/selection/legends/necromancer-portrait@player-tile-picked@2x.webp';
import oraclePortraitAllyTile from '../../assets/selection/legends/oracle-portrait@ally-tile.webp';
import oraclePortraitAllyTile2x from '../../assets/selection/legends/oracle-portrait@ally-tile@2x.webp';
import oraclePortraitPlayerTilePicked from '../../assets/selection/legends/oracle-portrait@player-tile-picked.webp';
import oraclePortraitPlayerTilePicked2x from '../../assets/selection/legends/oracle-portrait@player-tile-picked@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/** Part of the `selection` group: the Legend portraits drawn in the roster tiles. */
export const SELECTION_PORTRAIT_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'catalyst-portrait',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: catalystPortraitAllyTile,
      bytes: 7812,
      hash: '2b7c8059ceb8ae208326b34f29b6c96320bdaba23c4f73c14a0baec3d2a12fd7',
    },
    file2x: {
      url: catalystPortraitAllyTile2x,
      bytes: 24276,
      hash: '64e69dcd0312c65dd65826231fb13fbd1e2209c51313396d2afc2cf74dd4793f',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 62:212 (Figma: Veridan) cropped to (1775, 848, 60, 60), removed: 2 px amber stroke, drop shadow (0, 4, blur 20, 60 % black); player-tile-picked = 58:398 resized to 70 (V1) cropped to (1750, 843, 70, 70), removed: 2 px amber stroke, drop shadow (0, 4, blur 20, 60 % black)',
    renditions: {
      'ally-tile': {
        file: {
          url: catalystPortraitAllyTile,
          bytes: 7812,
          hash: '2b7c8059ceb8ae208326b34f29b6c96320bdaba23c4f73c14a0baec3d2a12fd7',
        },
        file2x: {
          url: catalystPortraitAllyTile2x,
          bytes: 24276,
          hash: '64e69dcd0312c65dd65826231fb13fbd1e2209c51313396d2afc2cf74dd4793f',
        },
      },
      'player-tile-picked': {
        file: {
          url: catalystPortraitPlayerTilePicked,
          bytes: 9990,
          hash: 'b1b59820a111c50a8ee7fe4afaa78c2154d5caa826fafaa9f63c17e0b1e6e573',
        },
        file2x: {
          url: catalystPortraitPlayerTilePicked2x,
          bytes: 30874,
          hash: 'c857f3836addd6db78822aee4c7bacf4300924a246c3c1ba647caeebab2a1e38',
        },
      },
    },
  },
  {
    id: 'legionnaire-legend-portrait',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: legionnaireLegendPortraitAllyTile,
      bytes: 6894,
      hash: 'd0b5f3caedde148fecaa080db87fd2cf7427ef69fe39de2341646716e5fef1e5',
    },
    file2x: {
      url: legionnaireLegendPortraitAllyTile2x,
      bytes: 22802,
      hash: '5eac2eca5928787636559bcb67dc46bc61b92a0fd2d8b0cbe99bf478ae508431',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 72:871 cropped to (1775, 248, 60, 60), removed: 2 px red stroke; player-tile-picked = 58:339 re-filled with 72:870 paints (V1) cropped to (1750, 768, 70, 70), removed: 1 px white 40 % stroke',
    renditions: {
      'ally-tile': {
        file: {
          url: legionnaireLegendPortraitAllyTile,
          bytes: 6894,
          hash: 'd0b5f3caedde148fecaa080db87fd2cf7427ef69fe39de2341646716e5fef1e5',
        },
        file2x: {
          url: legionnaireLegendPortraitAllyTile2x,
          bytes: 22802,
          hash: '5eac2eca5928787636559bcb67dc46bc61b92a0fd2d8b0cbe99bf478ae508431',
        },
      },
      'player-tile-picked': {
        file: {
          url: legionnaireLegendPortraitPlayerTilePicked,
          bytes: 9066,
          hash: 'c4790c0f6aa8a2b3802e8be9ebbc20c51e4977326b5ee5486a26c0d46ae1bad9',
        },
        file2x: {
          url: legionnaireLegendPortraitPlayerTilePicked2x,
          bytes: 29528,
          hash: '977cbca1c5bd0e7c33221230cdf912537c84f454548f27e3585a654a790d48cf',
        },
      },
    },
  },
  {
    id: 'necromancer-portrait',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: necromancerPortraitAllyTile,
      bytes: 5776,
      hash: '14a57913d84c6e64a005d3ae951ca2139253574ab8c7856fbdd7a55b5d4cd8c9',
    },
    file2x: {
      url: necromancerPortraitAllyTile2x,
      bytes: 18202,
      hash: 'dc717c289a5f76c22001dcd32150bd00706cdb360f42b08626b924d10c6ef1f2',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 62:209 (Figma: Avedrin) cropped to (1775, 623, 60, 60), removed: 2 px violet stroke, drop shadow (0, 4, blur 20, 60 % black); player-tile-picked = 58:400 resized to 70 (V1) cropped to (1750, 618, 70, 70), removed: 2 px violet stroke, drop shadow (0, 4, blur 20, 60 % black). The grey radial under-fill is baked (FID-06)',
    renditions: {
      'ally-tile': {
        file: {
          url: necromancerPortraitAllyTile,
          bytes: 5776,
          hash: '14a57913d84c6e64a005d3ae951ca2139253574ab8c7856fbdd7a55b5d4cd8c9',
        },
        file2x: {
          url: necromancerPortraitAllyTile2x,
          bytes: 18202,
          hash: 'dc717c289a5f76c22001dcd32150bd00706cdb360f42b08626b924d10c6ef1f2',
        },
      },
      'player-tile-picked': {
        file: {
          url: necromancerPortraitPlayerTilePicked,
          bytes: 7486,
          hash: 'fb029b772f151272c249c2cf4ab1cf68dcd54f4b31b2c6e9af92207bdabb967e',
        },
        file2x: {
          url: necromancerPortraitPlayerTilePicked2x,
          bytes: 23660,
          hash: 'a7c32ac3054348407a1827ced6f0f56e896e7b53b5e8e90da9cc90284a12f6b1',
        },
      },
    },
  },
  {
    id: 'oracle-portrait',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: oraclePortraitAllyTile,
      bytes: 3504,
      hash: 'f693d053298b15958e54728aef8a49b5f9aeec05e9bdc3b1cd98a99c1ccd27d8',
    },
    file2x: {
      url: oraclePortraitAllyTile2x,
      bytes: 10174,
      hash: 'fb814474a778dc4fc18fbdfd40e14911544d58bb27577a952c19829ea1c11d25',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); pass sub-P1-nonglass: black/white frame-fill pair (r1-log W17/W18); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 72:870 re-filled with 58:392 paints (V1; Figma: Elarion) cropped to (1755, 248, 60, 60), removed: 2 px red stroke; player-tile-picked = 58:392 cropped to (1750, 318, 70, 70), removed: 2 px pale blue stroke, both drop shadows',
    renditions: {
      'ally-tile': {
        file: {
          url: oraclePortraitAllyTile,
          bytes: 3504,
          hash: 'f693d053298b15958e54728aef8a49b5f9aeec05e9bdc3b1cd98a99c1ccd27d8',
        },
        file2x: {
          url: oraclePortraitAllyTile2x,
          bytes: 10174,
          hash: 'fb814474a778dc4fc18fbdfd40e14911544d58bb27577a952c19829ea1c11d25',
        },
      },
      'player-tile-picked': {
        file: {
          url: oraclePortraitPlayerTilePicked,
          bytes: 4422,
          hash: '9f46abfeaaee6b615d32e727d2042128c4cd8f0568b8b49cc61bd665fbf551b1',
        },
        file2x: {
          url: oraclePortraitPlayerTilePicked2x,
          bytes: 12918,
          hash: 'ccd1cad388d76240eef8084cd4b8ac34bbc2e36d8c06ea1f31a5290381d5d635',
        },
      },
    },
  },
];
