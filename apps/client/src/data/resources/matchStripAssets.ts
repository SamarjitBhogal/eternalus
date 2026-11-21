import allegianceFlag from '../../assets/match/objectives/allegiance-flag.webp';
import allegianceFlag2x from '../../assets/match/objectives/allegiance-flag@2x.webp';
import allegianceFlagMirrored from '../../assets/match/objectives/allegiance-flag@mirrored.webp';
import allegianceFlagMirrored2x from '../../assets/match/objectives/allegiance-flag@mirrored@2x.webp';
import objectiveCrystal from '../../assets/match/objectives/objective-crystal.webp';
import objectiveCrystal2x from '../../assets/match/objectives/objective-crystal@2x.webp';
import objectiveShieldDark from '../../assets/match/objectives/objective-shield-dark.webp';
import objectiveShieldDark2x from '../../assets/match/objectives/objective-shield-dark@2x.webp';
import objectiveShieldLight from '../../assets/match/objectives/objective-shield-light.webp';
import objectiveShieldLight2x from '../../assets/match/objectives/objective-shield-light@2x.webp';
import objectiveShieldNeutral from '../../assets/match/objectives/objective-shield-neutral.webp';
import objectiveShieldNeutral2x from '../../assets/match/objectives/objective-shield-neutral@2x.webp';
import structureBuffTower from '../../assets/match/structures/structure-buff-tower.webp';
import structureBuffTower2x from '../../assets/match/structures/structure-buff-tower@2x.webp';
import structureBuffTowerMirrored from '../../assets/match/structures/structure-buff-tower@mirrored.webp';
import structureBuffTowerMirrored2x from '../../assets/match/structures/structure-buff-tower@mirrored@2x.webp';
import structureSpawnerTower from '../../assets/match/structures/structure-spawner-tower.webp';
import structureSpawnerTower2x from '../../assets/match/structures/structure-spawner-tower@2x.webp';
import structureSpawnerTowerMirrored from '../../assets/match/structures/structure-spawner-tower@mirrored.webp';
import structureSpawnerTowerMirrored2x from '../../assets/match/structures/structure-spawner-tower@mirrored@2x.webp';
import structureStronghold from '../../assets/match/structures/structure-stronghold.webp';
import structureStronghold2x from '../../assets/match/structures/structure-stronghold@2x.webp';
import structureStrongholdMirrored from '../../assets/match/structures/structure-stronghold@mirrored.webp';
import structureStrongholdMirrored2x from '../../assets/match/structures/structure-stronghold@mirrored@2x.webp';
import structureWall from '../../assets/match/structures/structure-wall.webp';
import structureWall2x from '../../assets/match/structures/structure-wall@2x.webp';
import structureWallMirrored from '../../assets/match/structures/structure-wall@mirrored.webp';
import structureWallMirrored2x from '../../assets/match/structures/structure-wall@mirrored@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * Part of the `match` group: the structure and objective strips (structure masks, shields, flag,
 * crystal).
 */
export const MATCH_STRIP_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'allegiance-flag',
    type: 'ui-image',
    group: 'match',
    file: {
      url: allegianceFlag,
      bytes: 206,
      hash: 'ff81e09867a923adad88208e4c4237e86621ca24eec009b47040cab9c902317b',
    },
    file2x: {
      url: allegianceFlag2x,
      bytes: 372,
      hash: '79f153c0e29b8d5f96284dd1ca35b247b949520738466ddddd64a921fe0b2c03',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons FlagBannerFold glyph (MIT) as drawn in Figma z5Udjg41B9Vtcb9IJHHyTs node 65:669, outside frame 62:231: read-only 4x export flag-65-669@4x.png (SHA-256 9e6151981a63d858d6e12fd78add54f58a321e4fe690ac591f04886a9fcbfc51, flattened on the canvas grey), coverage box-filtered to 18x18 (2x 36x36), RGB white, max alpha 255, lossless WebP; file = the (893, 72, 18, 18) use, mirrored = a lossless pixel mirror for (1013, 72, 18, 18) (CD-03)',
    renditions: {
      mirrored: {
        file: {
          url: allegianceFlagMirrored,
          bytes: 200,
          hash: '0e276ed531990d477884c021a0b88bb5e9305ed37d65ae620bbef5494ae4b6c0',
        },
        file2x: {
          url: allegianceFlagMirrored2x,
          bytes: 372,
          hash: 'ade6a9a7d2af8a61c8deef295f8b8675d3472ff75a11d3ea960e471272519bae',
        },
      },
    },
  },
  {
    id: 'objective-crystal',
    type: 'ui-image',
    group: 'match',
    file: {
      url: objectiveCrystal,
      bytes: 27038,
      hash: '484df9cf64d8489bdc4af1cfd4deb2b211ed29f27d971771426add7d2981cd75',
    },
    file2x: {
      url: objectiveCrystal2x,
      bytes: 69754,
      hash: 'b2ff271bf816a922b1f8eec51eb1fa00ade47b17edf3ba377ae4f7f139880576',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1b: black/white frame-fill pair (r1-log W27/W28); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:623 cropped to (833, 118, 256, 256), nothing removed, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'objective-shield-dark',
    type: 'ui-image',
    group: 'match',
    file: {
      url: objectiveShieldDark,
      bytes: 2184,
      hash: '29caaf49fa0ef64194c0f35665664156f38c566175fc6d0e5b8ea3056252b0f1',
    },
    file2x: {
      url: objectiveShieldDark2x,
      bytes: 5564,
      hash: 'cfef7a3501a90d32d148ef88bac8c104910228611f93f254d29c6e759cba9bdb',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:616 (enemy) cropped to (1032, 71, 54, 63) (fractional box (1032.23, 71.25, 53.53, 62.66) baked), nothing removed',
  },
  {
    id: 'objective-shield-light',
    type: 'ui-image',
    group: 'match',
    file: {
      url: objectiveShieldLight,
      bytes: 2460,
      hash: 'c9774e0f1dc43e3752e907e1bcf787e273da1a3ebcd83b44f903c36f2c100215',
    },
    file2x: {
      url: objectiveShieldLight2x,
      bytes: 7106,
      hash: 'bad2bdb8f3aa33698062c6ae04c367131a07c893fa71d6b63d9ddc6347524c8f',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:621 (allied) cropped to (838, 71, 54, 63) (fractional box (838.23, 71.25, 53.53, 62.66) baked), nothing removed',
  },
  {
    id: 'objective-shield-neutral',
    type: 'ui-image',
    group: 'match',
    file: {
      url: objectiveShieldNeutral,
      bytes: 2298,
      hash: '2a222b616285849daf6db9ef7d74677fad8c52835943b8d73a88a4d39201cc89',
    },
    file2x: {
      url: objectiveShieldNeutral2x,
      bytes: 6482,
      hash: '0560f69a50c0f390fdc6d4be4fcdd5e6175336b11591241631e23faec3d90d53',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:606 cropped to (934, 71, 54, 63) (fractional box (934.23, 71.25, 53.53, 62.66) baked), nothing removed',
  },
  {
    id: 'structure-buff-tower',
    type: 'ui-image',
    group: 'match',
    file: {
      url: structureBuffTower,
      bytes: 490,
      hash: '239199776314a205320b50b4d9f8f37514371f0e07ecab568b199501e2ce489c',
    },
    file2x: {
      url: structureBuffTower2x,
      bytes: 884,
      hash: '2461b79e67b232e467112f03217b06a2d627efd3dff2663feaefcd4b5ea4a306',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:322 CellTower (allied) cropped to (461, 72, 50, 50), nothing removed; mirrored = 65:558 (enemy) cropped to (1410, 72, 50, 50), nothing removed. A mask: alpha = Figma coverage x 0.8 fill opacity (max 204), RGB white (I-05)',
    renditions: {
      mirrored: {
        file: {
          url: structureBuffTowerMirrored,
          bytes: 482,
          hash: '5e1c846345aa752a2ed86e0a205374984e8a3cb488fed0bb742a98b1d4001403',
        },
        file2x: {
          url: structureBuffTowerMirrored2x,
          bytes: 856,
          hash: 'e1d0f3ad7744f8e2ebc3aed43228bfb0a34c59077f01db4f5c35376dfb137966',
        },
      },
    },
  },
  {
    id: 'structure-spawner-tower',
    type: 'ui-image',
    group: 'match',
    file: {
      url: structureSpawnerTower,
      bytes: 438,
      hash: 'ae83350df3540e35c1650b7c55523bee360ec7a2a03ee010050c8a602efcb98c',
    },
    file2x: {
      url: structureSpawnerTower2x,
      bytes: 790,
      hash: 'b29fca53ee96146635ce8aeac90587fe77a18a6938e210f3229f3019ad94a4b9',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:344 NuclearPlant (allied) cropped to (635, 72, 50, 50), nothing removed; mirrored = 65:589 (enemy) cropped to (1120, 72, 50, 50), nothing removed. A mask: alpha = Figma coverage x 0.8 fill opacity (max 204), RGB white (I-05)',
    renditions: {
      mirrored: {
        file: {
          url: structureSpawnerTowerMirrored,
          bytes: 436,
          hash: '100ee66468e1aa111513d37e07514932d8ddcd839303a9e7900c1f8787f255d0',
        },
        file2x: {
          url: structureSpawnerTowerMirrored2x,
          bytes: 784,
          hash: '9f566af1150f3ca6bfdab9260ebb1c63386f23269f21dfa9450ce4d69539edb1',
        },
      },
    },
  },
  {
    id: 'structure-stronghold',
    type: 'ui-image',
    group: 'match',
    file: {
      url: structureStronghold,
      bytes: 298,
      hash: '8633865628ec453d3ba73e1b4ded12f8a17d07cd724ec366be31adb8f22c7b2d',
    },
    file2x: {
      url: structureStronghold2x,
      bytes: 406,
      hash: '27db3e3edb23ddccc6e4db7ffa379175e5b75b7c3527872412eddb116757a2a9',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:307 CastleTurret (allied) cropped to (345, 72, 50, 50), nothing removed; mirrored = 65:545 (enemy, mirrored in Figma) cropped to (1526, 72, 50, 50), nothing removed. A mask: alpha = Figma coverage x 0.8 fill opacity (max 204), RGB white (I-05)',
    renditions: {
      mirrored: {
        file: {
          url: structureStrongholdMirrored,
          bytes: 294,
          hash: '2917153500f1ae2362d98e4eecba09fe9e9245e5a0deefd4aae02c47cd03c264',
        },
        file2x: {
          url: structureStrongholdMirrored2x,
          bytes: 400,
          hash: 'a46d4e831101c34ee2a55882c48e127e08543f81fdbd6eacb8db4b31f51bd1c3',
        },
      },
    },
  },
  {
    id: 'structure-wall',
    type: 'ui-image',
    group: 'match',
    file: {
      url: structureWall,
      bytes: 176,
      hash: 'cb2c06db4a24088828eddbd5ee1cfd6035a7952c33543ee87226e8824449caa8',
    },
    file2x: {
      url: structureWall2x,
      bytes: 190,
      hash: '0ebdd9f5949afd5db13101c351f19112638aa60200865ef7202e7c6f13c53391',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:314 Wall (allied) cropped to (403, 72, 50, 50), nothing removed; mirrored = 65:551 (enemy) cropped to (1468, 72, 50, 50), nothing removed. A mask: alpha = Figma coverage x 0.8 fill opacity (max 204), RGB white (I-05)',
    renditions: {
      mirrored: {
        file: {
          url: structureWallMirrored,
          bytes: 174,
          hash: '5edf7c4684e2f154f0b195b77bca42446ac0c10a14af2cebb2cc5b2d9c07aac1',
        },
        file2x: {
          url: structureWallMirrored2x,
          bytes: 190,
          hash: '91a9422e9c90e93d858078a44c9a76621912a44224ac41ad93d3a2f2b6046571',
        },
      },
    },
  },
];
