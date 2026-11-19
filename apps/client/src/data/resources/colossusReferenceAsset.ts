import type { AssetManifestEntry } from './AssetManifest.types';
import base from '../../assets/selection/legends/colossus-reference-art.webp';
import base2x from '../../assets/selection/legends/colossus-reference-art@2x.webp';
import colossusCardIdle from '../../assets/selection/legends/colossus-reference-art@card-idle.webp';
import colossusCardIdle2x from '../../assets/selection/legends/colossus-reference-art@card-idle@2x.webp';
import colossusCardPicked from '../../assets/selection/legends/colossus-reference-art@card-picked.webp';
import colossusCardPicked2x from '../../assets/selection/legends/colossus-reference-art@card-picked@2x.webp';
import colossusRefractionIdle from '../../assets/selection/legends/colossus-reference-art@refraction-idle.webp';
import colossusRefractionIdle2x from '../../assets/selection/legends/colossus-reference-art@refraction-idle@2x.webp';
import colossusRefractionPicked from '../../assets/selection/legends/colossus-reference-art@refraction-picked.webp';
import colossusRefractionPicked2x from '../../assets/selection/legends/colossus-reference-art@refraction-picked@2x.webp';
import colossusLegendMini from '../../assets/selection/legends/colossus-reference-art@legend-mini.webp';
import colossusLegendMini2x from '../../assets/selection/legends/colossus-reference-art@legend-mini@2x.webp';
import colossusAllyTile from '../../assets/selection/legends/colossus-reference-art@ally-tile.webp';
import colossusAllyTile2x from '../../assets/selection/legends/colossus-reference-art@ally-tile@2x.webp';
import colossusPlayerTilePicked from '../../assets/selection/legends/colossus-reference-art@player-tile-picked.webp';
import colossusPlayerTilePicked2x from '../../assets/selection/legends/colossus-reference-art@player-tile-picked@2x.webp';
/** User-authorised colossus selection art at the existing layout's native boxes. */
export const COLOSSUS_REFERENCE_ASSET: AssetManifestEntry = {
  id: 'colossus-reference-art',
  attachmentReferenceId: 'colossus-reference',
  type: 'ui-image',
  group: 'selection',
  licence: 'user-authorised-art',
  source:
    'User-provided flat750x075f-pad750x1000f8f8f8.jpg; permission to use and adapt confirmed by Gurshaan 2026-11-12; native-size selection renditions; see docs/reference/legend-sprite-provenance.md',
  file: {
    url: base,
    bytes: 63366,
    hash: 'a92356df77962ff894d4cfe2418dd5f9469150848e9b0b6bf116422eb9bc9784',
  },
  file2x: {
    url: base2x,
    bytes: 213502,
    hash: '715d5a62a64df31b046ed849c58de4946301a5569c6dd29eda8e1c056b21dbf0',
  },
  renditions: {
    'card-idle': {
      file: {
        url: colossusCardIdle,
        bytes: 70170,
        hash: '549d5a2246212c16eaa3d69f70db54c7e07aa3d7c459abf2a54f615eed02c52a',
      },
      file2x: {
        url: colossusCardIdle2x,
        bytes: 233236,
        hash: '8f6ab61e957b3b39464f23f92f33cc0a88bfb36e1e5f2e1ae7a3cb2263bc02a6',
      },
      box: { left: 665, top: 255, width: 266, height: 568 },
    },
    'card-picked': {
      file: {
        url: colossusCardPicked,
        bytes: 93138,
        hash: '5d300e1751c6614d2a654238c3bb7e2ee7cd6f8224f88b843f032c470a958e71',
      },
      file2x: {
        url: colossusCardPicked2x,
        bytes: 315728,
        hash: 'b6bbb999222b846e7f059a94bd760aa5418be64a0f0ee7c14115f63d55b750ad',
      },
      box: { left: 642, top: 210, width: 314, height: 660 },
    },
    'refraction-idle': {
      file: {
        url: colossusRefractionIdle,
        bytes: 88960,
        hash: '12be8bac449c12f745f0f78a93374044107477b405bfb5b6faeefe4f07856ebd',
      },
      file2x: {
        url: colossusRefractionIdle2x,
        bytes: 299544,
        hash: '5a2dec7656b5564b55d3db397dc5ee3dc086e39a0a1eac5960781c634dda01a4',
      },
      box: { left: 645, top: 226, width: 305, height: 620 },
    },
    'refraction-picked': {
      file: {
        url: colossusRefractionPicked,
        bytes: 114948,
        hash: 'd214a03d47ebec5525504ad1d541ff740aa695f7d8faef10ace36f238a5f4921',
      },
      file2x: {
        url: colossusRefractionPicked2x,
        bytes: 393202,
        hash: 'a515f1253c30ddc4952d45dbf11d01645bffbe08c6c5b7485d086b5acd3bf5c7',
      },
      box: { left: 617, top: 181, width: 355, height: 699 },
    },
    'legend-mini': {
      file: {
        url: colossusLegendMini,
        bytes: 12614,
        hash: '0924fa95b24472d456260ba04cfeeb3ccb270ff11dadfd349b7aceaee7cca2df',
      },
      file2x: {
        url: colossusLegendMini2x,
        bytes: 41816,
        hash: '3963d4424b830f1504afbd990f0a4df2df7a24d3889adfe573e6695baf1e34ca',
      },
      box: { left: 71, top: 804, width: 99, height: 134 },
    },
    'ally-tile': {
      file: {
        url: colossusAllyTile,
        bytes: 3054,
        hash: '6370bf3aecd9fdd109d5f570bd0d50b8c635bc92fb3ffb90649eabe52b2c45cd',
      },
      file2x: {
        url: colossusAllyTile2x,
        bytes: 10020,
        hash: '92f7d6d466955d57aa0ae67db9335120a70b81cb2695d9fd6ae58a6febcd85fe',
      },
    },
    'player-tile-picked': {
      file: {
        url: colossusPlayerTilePicked,
        bytes: 3888,
        hash: '87deef9b739bfdba5f142502389e26923593acc55d1a8611e5398c656079975b',
      },
      file2x: {
        url: colossusPlayerTilePicked2x,
        bytes: 13076,
        hash: 'cccb2d1c3776fe99a8e26e2de8a69754b8d1bd6d7fbfd08d9909a99bff3ce3c1',
      },
    },
  },
};
