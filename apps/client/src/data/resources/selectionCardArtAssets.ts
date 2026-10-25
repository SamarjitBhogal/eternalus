import catalystCardArtCardIdle from '../../assets/selection/legends/catalyst-card-art@card-idle.webp';
import catalystCardArtCardIdle2x from '../../assets/selection/legends/catalyst-card-art@card-idle@2x.webp';
import catalystCardArtCardPicked from '../../assets/selection/legends/catalyst-card-art@card-picked.webp';
import catalystCardArtCardPicked2x from '../../assets/selection/legends/catalyst-card-art@card-picked@2x.webp';
import catalystCardArtRefractionIdle from '../../assets/selection/legends/catalyst-card-art@refraction-idle.webp';
import catalystCardArtRefractionIdle2x from '../../assets/selection/legends/catalyst-card-art@refraction-idle@2x.webp';
import catalystCardArtRefractionPicked from '../../assets/selection/legends/catalyst-card-art@refraction-picked.webp';
import catalystCardArtRefractionPicked2x from '../../assets/selection/legends/catalyst-card-art@refraction-picked@2x.webp';
import necromancerCardArtCardIdle from '../../assets/selection/legends/necromancer-card-art@card-idle.webp';
import necromancerCardArtCardIdle2x from '../../assets/selection/legends/necromancer-card-art@card-idle@2x.webp';
import necromancerCardArtCardPicked from '../../assets/selection/legends/necromancer-card-art@card-picked.webp';
import necromancerCardArtCardPicked2x from '../../assets/selection/legends/necromancer-card-art@card-picked@2x.webp';
import necromancerCardArtRefractionIdle from '../../assets/selection/legends/necromancer-card-art@refraction-idle.webp';
import necromancerCardArtRefractionIdle2x from '../../assets/selection/legends/necromancer-card-art@refraction-idle@2x.webp';
import necromancerCardArtRefractionPicked from '../../assets/selection/legends/necromancer-card-art@refraction-picked.webp';
import necromancerCardArtRefractionPicked2x from '../../assets/selection/legends/necromancer-card-art@refraction-picked@2x.webp';
import oracleCardArtCardIdle from '../../assets/selection/legends/oracle-card-art@card-idle.webp';
import oracleCardArtCardIdle2x from '../../assets/selection/legends/oracle-card-art@card-idle@2x.webp';
import oracleCardArtCardPicked from '../../assets/selection/legends/oracle-card-art@card-picked.webp';
import oracleCardArtCardPicked2x from '../../assets/selection/legends/oracle-card-art@card-picked@2x.webp';
import oracleRefractionArtRefractionIdle from '../../assets/selection/legends/oracle-refraction-art@refraction-idle.webp';
import oracleRefractionArtRefractionIdle2x from '../../assets/selection/legends/oracle-refraction-art@refraction-idle@2x.webp';
import oracleRefractionArtRefractionPicked from '../../assets/selection/legends/oracle-refraction-art@refraction-picked.webp';
import oracleRefractionArtRefractionPicked2x from '../../assets/selection/legends/oracle-refraction-art@refraction-picked@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/** Part of the `selection` group: the Legend card arts and their refraction copies. */
export const SELECTION_CARD_ART_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'catalyst-card-art',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: catalystCardArtCardIdle,
      bytes: 137886,
      hash: '36a61db0eb488403f1bd2173a90141853018757a5ba66a65f6f889a92a12014f',
    },
    file2x: {
      url: catalystCardArtCardIdle2x,
      bytes: 83498,
      hash: '8b797e1aaf389eee970622427776143cf209b1a4a984652f3039136e147f937d',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-P1-nonglass: black/white frame-fill pair (r1-log W17/W18); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); pass sub-P1b-refraction: black/white frame-fill pair (r1-log W19/W20); pass sub-V2-refraction-variants: black/white frame-fill pair (r1-log W23/W24; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. card-idle = 58:360 cropped to (505, 255, 266, 568) (fractional box (505.51, 255.42, 264.51, 566.93) baked), nothing removed, 2x lossy q92 (alpha lossless); card-picked = 55:255 dup re-imaged (V1) cropped to (482, 210, 314, 660) (fractional box (482.09, 210, 313.71, 659.46) baked), removed: 2 px cream stroke, both glows, 2x lossy q92 (alpha lossless); refraction-idle = 61:20 cropped to (485, 226, 305, 620) (fractional box (485.19, 226.91, 304.18, 618.2) baked), removed: 61:3 LAYER_BLUR, GLASS and opacity 0.6 (drawn live), 2x lossy q92 (alpha lossless); refraction-picked = 61:8 dup re-imaged (V2) cropped to (457, 181, 355, 699) (fractional box (457.55, 181.93, 353.86, 697.64) baked), removed: 2 px cream stroke, both glows; 61:3 LAYER_BLUR, GLASS and opacity 0.6 (drawn live), 2x lossy q92 (alpha lossless)',
    renditions: {
      'card-idle': {
        file: {
          url: catalystCardArtCardIdle,
          bytes: 137886,
          hash: '36a61db0eb488403f1bd2173a90141853018757a5ba66a65f6f889a92a12014f',
        },
        file2x: {
          url: catalystCardArtCardIdle2x,
          bytes: 83498,
          hash: '8b797e1aaf389eee970622427776143cf209b1a4a984652f3039136e147f937d',
        },
        box: { left: 505, top: 255, width: 266, height: 568 },
      },
      'card-picked': {
        file: {
          url: catalystCardArtCardPicked,
          bytes: 184268,
          hash: 'ee8d255f3b7f9f5422bc8cfc9c88a03b6d0ebc6ea53d3d658f251dfed746143a',
        },
        file2x: {
          url: catalystCardArtCardPicked2x,
          bytes: 112208,
          hash: '7e83610e07b9e35f36b7ed24f05338b5e20f4eeda1e7d3a54b8fd25c9b464373',
        },
        box: { left: 482, top: 210, width: 314, height: 660 },
      },
      'refraction-idle': {
        file: {
          url: catalystCardArtRefractionIdle,
          bytes: 165188,
          hash: '9c903728d576500c35605f51d5756f2af2086fda4263b5ee8d069a5c82a303a8',
        },
        file2x: {
          url: catalystCardArtRefractionIdle2x,
          bytes: 97918,
          hash: 'efbd6f15a7cf63482e0f905e977978779d83ee61fd2704c5313d4ea7883c44ea',
        },
        box: { left: 485, top: 226, width: 305, height: 620 },
      },
      'refraction-picked': {
        file: {
          url: catalystCardArtRefractionPicked,
          bytes: 211944,
          hash: '4a520a837a2f93cb11a829e1bb472e79ea6b2a1758c89068fac75e04c07c6b8f',
        },
        file2x: {
          url: catalystCardArtRefractionPicked2x,
          bytes: 128682,
          hash: '75f3fa8f8790926393d27629d4797bd65fefd07e02ff97cbf030340db841a12b',
        },
        box: { left: 457, top: 181, width: 355, height: 699 },
      },
    },
  },
  {
    id: 'necromancer-card-art',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: necromancerCardArtCardIdle,
      bytes: 118480,
      hash: '47c4c45cf628524f22473104b9e9dce0d4a25c61269489b9bf44b3d8732ac880',
    },
    file2x: {
      url: necromancerCardArtCardIdle2x,
      bytes: 59390,
      hash: 'bc85b199a06400e20ac36fcd8a4fa6e98294e7c9120dfed0def5f8e37afedc64',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-P1-nonglass: black/white frame-fill pair (r1-log W17/W18); pass sub-V3-necro-picked: black/white frame-fill pair (r1-log W39/W40; a non-Figma look made on the duplicate, OD-6, re-exported under OD-21(b)); pass sub-P1b-refraction: black/white frame-fill pair (r1-log W19/W20); pass sub-V2-refraction-variants: black/white frame-fill pair (r1-log W23/W24; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. card-idle = 58:365 cropped to (1149, 256, 265, 567) (fractional box (1149, 256.04, 264.51, 566.93) baked), nothing removed, 2x lossy q92 (alpha lossless); card-picked = agent clone 134:2 of the 55:255 dup (V3; necromancer image in CROP mode on its opaque rows 17-646, so the arch is opaque, OD-21(b)) cropped to (1125, 210, 315, 660) (fractional box (1125.75, 210, 313.71, 659.46) baked), removed: 2 px cream stroke, both glows, 2x lossy q92 (alpha lossless); refraction-idle = 61:14 cropped to (1127, 227, 306, 619) (fractional box (1127.99, 227.9, 304.18, 617.22) baked), removed: 61:3 LAYER_BLUR, GLASS and opacity 0.6 (drawn live), 2x lossy q92 (alpha lossless); refraction-picked = agent clone 116:2 of the 61:8 dup (V2) cropped to (1101, 181, 355, 699) (fractional box (1101.21, 181.93, 353.86, 697.64) baked), removed: 2 px cream stroke, both glows; 61:3 LAYER_BLUR, GLASS and opacity 0.6 (drawn live), 2x lossy q92 (alpha lossless)',
    renditions: {
      'card-idle': {
        file: {
          url: necromancerCardArtCardIdle,
          bytes: 118480,
          hash: '47c4c45cf628524f22473104b9e9dce0d4a25c61269489b9bf44b3d8732ac880',
        },
        file2x: {
          url: necromancerCardArtCardIdle2x,
          bytes: 59390,
          hash: 'bc85b199a06400e20ac36fcd8a4fa6e98294e7c9120dfed0def5f8e37afedc64',
        },
        box: { left: 1149, top: 256, width: 265, height: 567 },
      },
      'card-picked': {
        file: {
          url: necromancerCardArtCardPicked,
          bytes: 165068,
          hash: 'fcbcaf3e63bd01bdb7051c5b5ee5ae0b1a12eaa4efd3d8e6c906acd08ddb5a30',
        },
        file2x: {
          url: necromancerCardArtCardPicked2x,
          bytes: 79210,
          hash: 'e16a6e6e24c8dbecab947902da09e899ea75455498a2820a4ac99b95b1e156a9',
        },
        box: { left: 1125, top: 210, width: 315, height: 660 },
      },
      'refraction-idle': {
        file: {
          url: necromancerCardArtRefractionIdle,
          bytes: 143516,
          hash: 'd766aecf05b17723081328353139b0dca00cd7f898ea6ba2fb36cc993c315d9e',
        },
        file2x: {
          url: necromancerCardArtRefractionIdle2x,
          bytes: 68550,
          hash: 'b799f75245a375b7835292c35b52b9ce9a770c234a4ced1e90dfa715452915bf',
        },
        box: { left: 1127, top: 227, width: 306, height: 619 },
      },
      'refraction-picked': {
        file: {
          url: necromancerCardArtRefractionPicked,
          bytes: 188926,
          hash: '9760a694da9fdffb4694c33eb24377c8537b011ce2d4bd9bd7421435d7b6b1e3',
        },
        file2x: {
          url: necromancerCardArtRefractionPicked2x,
          bytes: 98736,
          hash: '0358fe469da23a00467e115d3a487df42c2d02817b750d9bb010deb9a4f2c8a6',
        },
        box: { left: 1101, top: 181, width: 355, height: 699 },
      },
    },
  },
  {
    id: 'oracle-card-art',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: oracleCardArtCardIdle,
      bytes: 160178,
      hash: '1cb8aad8ca2f224a5e8d1a90d4e738fb32597d367b3dea712bb3ea46058638c4',
    },
    file2x: {
      url: oracleCardArtCardIdle2x,
      bytes: 91932,
      hash: 'f2a1b09f9718c8a42be4c8340b30a6bc95ddbd790ad58dc0a0b27bc270b3f3a5',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); pass sub-P1-nonglass: black/white frame-fill pair (r1-log W17/W18); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. card-idle = 58:360 dup re-imaged and moved (V1) cropped to (826, 255, 266, 568) (fractional box (826.84, 255.42, 264.51, 566.93) baked), nothing removed, 2x lossy q92 (alpha lossless); card-picked = 55:255 (2 px stroke and both glows removed) cropped to (803, 210, 315, 660) (fractional box (803.42, 210, 313.71, 659.46) baked), removed: 2 px cream stroke, both glows, 2x lossy q92 (alpha lossless)',
    renditions: {
      'card-idle': {
        file: {
          url: oracleCardArtCardIdle,
          bytes: 160178,
          hash: '1cb8aad8ca2f224a5e8d1a90d4e738fb32597d367b3dea712bb3ea46058638c4',
        },
        file2x: {
          url: oracleCardArtCardIdle2x,
          bytes: 91932,
          hash: 'f2a1b09f9718c8a42be4c8340b30a6bc95ddbd790ad58dc0a0b27bc270b3f3a5',
        },
        box: { left: 826, top: 255, width: 266, height: 568 },
      },
      'card-picked': {
        file: {
          url: oracleCardArtCardPicked,
          bytes: 219320,
          hash: '35d14d1a208798dde79465099fadd4f1ff136048a9638dd78fdf0787ed4bc58d',
        },
        file2x: {
          url: oracleCardArtCardPicked2x,
          bytes: 115240,
          hash: '11eb627b072117d254e3b342f9fce84b39682e38e3d56c28be5569b7b5350d3c',
        },
        box: { left: 803, top: 210, width: 315, height: 660 },
      },
    },
  },
  {
    id: 'oracle-refraction-art',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: oracleRefractionArtRefractionIdle,
      bytes: 177358,
      hash: '5221dc7ee02b3d24f4ecce31bbf02baa0b9674480e339a90e1cf0a84c01d6135',
    },
    file2x: {
      url: oracleRefractionArtRefractionIdle2x,
      bytes: 79338,
      hash: '32c3a1521506291fcf86dbe75c738c0c795371ab0acb5ce5e7b6bf8d4c75e72c',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, protocol R1 render (OA1) on scratch duplicate 96:205 of page 96:2; pass sub-P1b-refraction: black/white frame-fill pair (r1-log W19/W20); pass sub-V2-refraction-variants: black/white frame-fill pair (r1-log W23/W24; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. refraction-picked = 61:8 (stroke, glows and 61:3 blur/glass/opacity removed) cropped to (778, 181, 355, 699) (fractional box (778.88, 181.93, 353.86, 697.64) baked), removed: 2 px cream stroke, both glows; 61:3 LAYER_BLUR, GLASS and opacity 0.6 (drawn live), 2x lossy q92 (alpha lossless); refraction-idle = 61:20 dup re-imaged, shifted +700 px (V2) cropped to (1506, 226, 305, 620) (fractional box (806.52, 226.91, 304.18, 618.2) baked), removed: 61:3 LAYER_BLUR, GLASS and opacity 0.6 (drawn live), 2x lossy q92 (alpha lossless)',
    renditions: {
      'refraction-idle': {
        file: {
          url: oracleRefractionArtRefractionIdle,
          bytes: 177358,
          hash: '5221dc7ee02b3d24f4ecce31bbf02baa0b9674480e339a90e1cf0a84c01d6135',
        },
        file2x: {
          url: oracleRefractionArtRefractionIdle2x,
          bytes: 79338,
          hash: '32c3a1521506291fcf86dbe75c738c0c795371ab0acb5ce5e7b6bf8d4c75e72c',
        },
        box: { left: 806, top: 226, width: 305, height: 620 },
      },
      'refraction-picked': {
        file: {
          url: oracleRefractionArtRefractionPicked,
          bytes: 237570,
          hash: 'a8550223274e579c5a1d83cbef4c6b8c1587432948116b036c77a4f5aa9fdb13',
        },
        file2x: {
          url: oracleRefractionArtRefractionPicked2x,
          bytes: 104716,
          hash: 'a63fd7d0689585a54c4d7478415adb6b749f98c8f24015af6a2168e653041f12',
        },
        box: { left: 778, top: 181, width: 355, height: 699 },
      },
    },
  },
];
