import flyingSigilAllyTile from '../../assets/selection/classes/flying-sigil@ally-tile.webp';
import flyingSigilAllyTile2x from '../../assets/selection/classes/flying-sigil@ally-tile@2x.webp';
import flyingSigilPlayerTile from '../../assets/selection/classes/flying-sigil@player-tile.webp';
import flyingSigilPlayerTile2x from '../../assets/selection/classes/flying-sigil@player-tile@2x.webp';
import flyingSigilPlayerTilePicked from '../../assets/selection/classes/flying-sigil@player-tile-picked.webp';
import flyingSigilPlayerTilePicked2x from '../../assets/selection/classes/flying-sigil@player-tile-picked@2x.webp';
import magusSigilAllyTile from '../../assets/selection/classes/magus-sigil@ally-tile.webp';
import magusSigilAllyTile2x from '../../assets/selection/classes/magus-sigil@ally-tile@2x.webp';
import magusSigilPlayerTile from '../../assets/selection/classes/magus-sigil@player-tile.webp';
import magusSigilPlayerTile2x from '../../assets/selection/classes/magus-sigil@player-tile@2x.webp';
import magusSigilPlayerTilePicked from '../../assets/selection/classes/magus-sigil@player-tile-picked.webp';
import magusSigilPlayerTilePicked2x from '../../assets/selection/classes/magus-sigil@player-tile-picked@2x.webp';
import selectionBackdrop from '../../assets/selection/screen/selection-backdrop.webp';
import selectionBackdrop2x from '../../assets/selection/screen/selection-backdrop@2x.webp';
import selectionBanner from '../../assets/selection/screen/selection-banner.webp';
import selectionBanner2x from '../../assets/selection/screen/selection-banner@2x.webp';
import sentinelSigilAllyTile from '../../assets/selection/classes/sentinel-sigil@ally-tile.webp';
import sentinelSigilAllyTile2x from '../../assets/selection/classes/sentinel-sigil@ally-tile@2x.webp';
import sentinelSigilPlayerTile from '../../assets/selection/classes/sentinel-sigil@player-tile.webp';
import sentinelSigilPlayerTile2x from '../../assets/selection/classes/sentinel-sigil@player-tile@2x.webp';
import sentinelSigilPlayerTilePicked from '../../assets/selection/classes/sentinel-sigil@player-tile-picked.webp';
import sentinelSigilPlayerTilePicked2x from '../../assets/selection/classes/sentinel-sigil@player-tile-picked@2x.webp';
import warriorSigilAllyTile from '../../assets/selection/classes/warrior-sigil@ally-tile.webp';
import warriorSigilAllyTile2x from '../../assets/selection/classes/warrior-sigil@ally-tile@2x.webp';
import warriorSigilPlayerTile from '../../assets/selection/classes/warrior-sigil@player-tile.webp';
import warriorSigilPlayerTile2x from '../../assets/selection/classes/warrior-sigil@player-tile@2x.webp';
import warriorSigilPlayerTilePicked from '../../assets/selection/classes/warrior-sigil@player-tile-picked.webp';
import warriorSigilPlayerTilePicked2x from '../../assets/selection/classes/warrior-sigil@player-tile-picked@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/** Part of the `selection` group: the backdrop, the banner and the four class sigils. */
export const SELECTION_SCREEN_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'flying-sigil',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: flyingSigilAllyTile,
      bytes: 778,
      hash: '9c1f4cb6423e8bd070a083587abc3cfca2a2b2e3397fd938acbf2ebd8704e9ff',
    },
    file2x: {
      url: flyingSigilAllyTile2x,
      bytes: 1908,
      hash: '334778392c752267dd8659f55c852019fe7b15cc4f91b0184d0a61b516410704',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 62:207 cropped to (1775, 473, 60, 60), removed: 1 px white 40 % stroke; player-tile = 62:207 cropped to (1775, 473, 60, 60), removed: 1 px white 40 % stroke; player-tile-picked = 58:335 (V1, 70x70) cropped to (1750, 468, 70, 70), removed: 1 px white 40 % stroke. Alpha divided by 0.85 to a maximum of 255 (FID-05; the build applies .85)',
    renditions: {
      'ally-tile': {
        file: {
          url: flyingSigilAllyTile,
          bytes: 778,
          hash: '9c1f4cb6423e8bd070a083587abc3cfca2a2b2e3397fd938acbf2ebd8704e9ff',
        },
        file2x: {
          url: flyingSigilAllyTile2x,
          bytes: 1908,
          hash: '334778392c752267dd8659f55c852019fe7b15cc4f91b0184d0a61b516410704',
        },
      },
      'player-tile': {
        file: {
          url: flyingSigilPlayerTile,
          bytes: 778,
          hash: '9c1f4cb6423e8bd070a083587abc3cfca2a2b2e3397fd938acbf2ebd8704e9ff',
        },
        file2x: {
          url: flyingSigilPlayerTile2x,
          bytes: 1908,
          hash: '334778392c752267dd8659f55c852019fe7b15cc4f91b0184d0a61b516410704',
        },
      },
      'player-tile-picked': {
        file: {
          url: flyingSigilPlayerTilePicked,
          bytes: 950,
          hash: '9c2a85ea48c71f0235c351d8de7ca86bfb74cde12944fe9b47291898dc34f97a',
        },
        file2x: {
          url: flyingSigilPlayerTilePicked2x,
          bytes: 2342,
          hash: '4f994d07c4c910f2b9ebde2529da7661ef28937a375b272a945123f58eef8bed',
        },
      },
    },
  },
  {
    id: 'magus-sigil',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: magusSigilAllyTile,
      bytes: 1298,
      hash: '26da0c8dce54a913d3fae85889b8f904e8856fc2b86d9e698c06ec1d2a5847c6',
    },
    file2x: {
      url: magusSigilAllyTile2x,
      bytes: 3428,
      hash: '861679efab77f112ab53c3a3c59d477c68ec0dae25a84059b1644408e1895c1b',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 62:202 cropped to (1775, 173, 60, 60), removed: 2 px cream stroke; player-tile = 62:202 cropped to (1775, 173, 60, 60), removed: 2 px cream stroke; player-tile-picked = 58:331 (V1, 70x70) cropped to (1750, 168, 70, 70), removed: 2 px cream stroke. Alpha divided by 0.85 to a maximum of 255 (FID-05; the build applies .85)',
    renditions: {
      'ally-tile': {
        file: {
          url: magusSigilAllyTile,
          bytes: 1298,
          hash: '26da0c8dce54a913d3fae85889b8f904e8856fc2b86d9e698c06ec1d2a5847c6',
        },
        file2x: {
          url: magusSigilAllyTile2x,
          bytes: 3428,
          hash: '861679efab77f112ab53c3a3c59d477c68ec0dae25a84059b1644408e1895c1b',
        },
      },
      'player-tile': {
        file: {
          url: magusSigilPlayerTile,
          bytes: 1298,
          hash: '26da0c8dce54a913d3fae85889b8f904e8856fc2b86d9e698c06ec1d2a5847c6',
        },
        file2x: {
          url: magusSigilPlayerTile2x,
          bytes: 3428,
          hash: '861679efab77f112ab53c3a3c59d477c68ec0dae25a84059b1644408e1895c1b',
        },
      },
      'player-tile-picked': {
        file: {
          url: magusSigilPlayerTilePicked,
          bytes: 1596,
          hash: '8af50a3f3c7ae63f81eb6d3469f568fedbbd12f8293d82c3862aca43a7027acf',
        },
        file2x: {
          url: magusSigilPlayerTilePicked2x,
          bytes: 4240,
          hash: '954a631e3a4caf0f9c64441080dc71d76478c33080ae2e476aa8af01a991442a',
        },
      },
    },
  },
  {
    id: 'selection-backdrop',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: selectionBackdrop,
      bytes: 1760320,
      hash: '5a2646f0561d334074cd665b09b81e80086f26f9c33fbff75a998e3f2cf0407c',
    },
    file2x: {
      url: selectionBackdrop2x,
      bytes: 458336,
      hash: '98eb768f052bd885d3d0d4ec679154a0e6cd997f06ecf585afd3bc93c771953f',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P0-backdrop: over the original frame fill with every layer but 62:130 hidden (r1-log W7); opaque crop; 1x lossless WebP. file = 62:125 frame fill + 62:130 cropped to (0, 0, 1920, 1080), nothing removed, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'selection-banner',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: selectionBanner,
      bytes: 90772,
      hash: 'ae0718eb0094d85017cac4a9d1b6a80560a135a87aa1bac9652000840b8d994b',
    },
    file2x: {
      url: selectionBanner2x,
      bytes: 45518,
      hash: '7e56d92a26b1eec2224d53f2f4b4140c732243baf70ad99a9178505ce10a33cc',
    },
    licence: 'owner',
    source:
      "Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:144 cropped to (102, 2, 1731, 92), nothing removed, 2x lossy q92 (alpha lossless). S5 winner: the R1 render (match, 0.03 % of pixels over dE 2.3) over the owner's Desktop strip (3.56 %, differs) and the source re-crops (6.4 to 8.6 %, differ); title 62:145 live",
  },
  {
    id: 'sentinel-sigil',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: sentinelSigilAllyTile,
      bytes: 768,
      hash: '512c9b09b31e2400b9f6133ef74161b80d5c9a1a71052c99066cd6d6ec3e3877',
    },
    file2x: {
      url: sentinelSigilAllyTile2x,
      bytes: 1926,
      hash: 'b8a7b2d9f4be18b64294a5f5428775fc5d710db52a12d64075efc6bcdcc3c983',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 62:210 cropped to (1775, 698, 60, 60), removed: 1 px white 40 % stroke; player-tile = 62:210 cropped to (1775, 698, 60, 60), removed: 1 px white 40 % stroke; player-tile-picked = 58:338 (V1, 70x70) cropped to (1750, 693, 70, 70), removed: 1 px white 40 % stroke. Alpha divided by 0.85 to a maximum of 255 (FID-05; the build applies .85)',
    renditions: {
      'ally-tile': {
        file: {
          url: sentinelSigilAllyTile,
          bytes: 768,
          hash: '512c9b09b31e2400b9f6133ef74161b80d5c9a1a71052c99066cd6d6ec3e3877',
        },
        file2x: {
          url: sentinelSigilAllyTile2x,
          bytes: 1926,
          hash: 'b8a7b2d9f4be18b64294a5f5428775fc5d710db52a12d64075efc6bcdcc3c983',
        },
      },
      'player-tile': {
        file: {
          url: sentinelSigilPlayerTile,
          bytes: 768,
          hash: '512c9b09b31e2400b9f6133ef74161b80d5c9a1a71052c99066cd6d6ec3e3877',
        },
        file2x: {
          url: sentinelSigilPlayerTile2x,
          bytes: 1926,
          hash: 'b8a7b2d9f4be18b64294a5f5428775fc5d710db52a12d64075efc6bcdcc3c983',
        },
      },
      'player-tile-picked': {
        file: {
          url: sentinelSigilPlayerTilePicked,
          bytes: 920,
          hash: '1bd16289d880d498b49307e988e5431ae6fc3c704a630510b41e60e6435351db',
        },
        file2x: {
          url: sentinelSigilPlayerTilePicked2x,
          bytes: 2270,
          hash: '2a3abbb06551a8a21c3e3c738d5dd093f096b3767a5eed8b816da01dc8f4fd20',
        },
      },
    },
  },
  {
    id: 'warrior-sigil',
    type: 'ui-image',
    group: 'selection',
    file: {
      url: warriorSigilAllyTile,
      bytes: 2410,
      hash: '16858f900144f2bdcfb3689e191f9645140cbc8885ce2f5ca04900882000c404',
    },
    file2x: {
      url: warriorSigilAllyTile2x,
      bytes: 7084,
      hash: 'c1504f307ca473d8b7c97f857aed3c3fb0dca4f1b754507f9de60b455d6eaaa5',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 58:271, 62:125, protocol R1 render (OA1) on scratch duplicate 96:205, 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); pass sub-V1-variants: black/white frame-fill pair (r1-log W21/W22; a non-Figma look made on the duplicate, OD-6); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. ally-tile = 62:208 cropped to (1775, 548, 60, 60), removed: 1 px white 40 % stroke, premultiplied mean with sub-P1-nonglass (1755, 548, 60, 60) (S5); player-tile = 62:208 cropped to (1775, 548, 60, 60), removed: 1 px white 40 % stroke, premultiplied mean with sub-P1-nonglass (1755, 548, 60, 60) (S5); player-tile-picked = 58:336 (V1, 70x70) cropped to (1750, 543, 70, 70), removed: 1 px white 40 % stroke. Alpha divided by 0.85 to a maximum of 255 (FID-05; the build applies .85); S5: the blended 60 px file matches both frames (1.27 % and 1.29 % over dE 2.3)',
    renditions: {
      'ally-tile': {
        file: {
          url: warriorSigilAllyTile,
          bytes: 2410,
          hash: '16858f900144f2bdcfb3689e191f9645140cbc8885ce2f5ca04900882000c404',
        },
        file2x: {
          url: warriorSigilAllyTile2x,
          bytes: 7084,
          hash: 'c1504f307ca473d8b7c97f857aed3c3fb0dca4f1b754507f9de60b455d6eaaa5',
        },
      },
      'player-tile': {
        file: {
          url: warriorSigilPlayerTile,
          bytes: 2410,
          hash: '16858f900144f2bdcfb3689e191f9645140cbc8885ce2f5ca04900882000c404',
        },
        file2x: {
          url: warriorSigilPlayerTile2x,
          bytes: 7084,
          hash: 'c1504f307ca473d8b7c97f857aed3c3fb0dca4f1b754507f9de60b455d6eaaa5',
        },
      },
      'player-tile-picked': {
        file: {
          url: warriorSigilPlayerTilePicked,
          bytes: 3096,
          hash: '0d32140adea1a60c4defbd85c235b1faa882a010a02bfd5d38888fb829bbe1e1',
        },
        file2x: {
          url: warriorSigilPlayerTilePicked2x,
          bytes: 8926,
          hash: '53ea4396a1a590114a8dc300984c1be2f4339410efa63471c490c3b019c0206b',
        },
      },
    },
  },
];
