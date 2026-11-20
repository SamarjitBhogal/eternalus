import type { AssetManifestEntry } from './AssetManifest.types';
import base from '../../assets/selection/legends/knight-reference-art.webp';
import base2x from '../../assets/selection/legends/knight-reference-art@2x.webp';
import knightCardIdle from '../../assets/selection/legends/knight-reference-art@card-idle.webp';
import knightCardIdle2x from '../../assets/selection/legends/knight-reference-art@card-idle@2x.webp';
import knightCardPicked from '../../assets/selection/legends/knight-reference-art@card-picked.webp';
import knightCardPicked2x from '../../assets/selection/legends/knight-reference-art@card-picked@2x.webp';
import knightRefractionIdle from '../../assets/selection/legends/knight-reference-art@refraction-idle.webp';
import knightRefractionIdle2x from '../../assets/selection/legends/knight-reference-art@refraction-idle@2x.webp';
import knightRefractionPicked from '../../assets/selection/legends/knight-reference-art@refraction-picked.webp';
import knightRefractionPicked2x from '../../assets/selection/legends/knight-reference-art@refraction-picked@2x.webp';
import knightLegendMini from '../../assets/selection/legends/knight-reference-art@legend-mini.webp';
import knightLegendMini2x from '../../assets/selection/legends/knight-reference-art@legend-mini@2x.webp';
import knightAllyTile from '../../assets/selection/legends/knight-reference-art@ally-tile.webp';
import knightAllyTile2x from '../../assets/selection/legends/knight-reference-art@ally-tile@2x.webp';
import knightPlayerTilePicked from '../../assets/selection/legends/knight-reference-art@player-tile-picked.webp';
import knightPlayerTilePicked2x from '../../assets/selection/legends/knight-reference-art@player-tile-picked@2x.webp';
/** User-authorised knight selection art at the existing layout's native boxes. */
export const KNIGHT_REFERENCE_ASSET: AssetManifestEntry = {
  id: 'knight-reference-art',
  attachmentReferenceId: 'knight-reference',
  type: 'ui-image',
  group: 'selection',
  licence: 'user-authorised-art',
  source:
    'User-provided Gemini_Generated_Image_vpyd7fvpyd7fvpyd.jpeg; permission to use and adapt confirmed by Gurshaan 2026-11-12; native-size selection renditions; see docs/reference/legend-sprite-provenance.md',
  file: {
    url: base,
    bytes: 76110,
    hash: '1090f4e97ce71b0788c0ea17eedf6c5fb3429ce542d2a331a97ff6f7e03a1b8c',
  },
  file2x: {
    url: base2x,
    bytes: 259742,
    hash: '9213f1d8f1fdae72c0d7879909b08c90207a241b1dd099edea9824c51332f2d6',
  },
  renditions: {
    'card-idle': {
      file: {
        url: knightCardIdle,
        bytes: 83174,
        hash: '6c499393017a778b5dae21b68f308caccb60f1b65f5b68bf8fd95e9303de0508',
      },
      file2x: {
        url: knightCardIdle2x,
        bytes: 283400,
        hash: '84abf1bc6c5e0cef88df5c642358fb02a538056da51eb4f78c62bfe7593b57dd',
      },
      box: { left: 826, top: 255, width: 266, height: 568 },
    },
    'card-picked': {
      file: {
        url: knightCardPicked,
        bytes: 111960,
        hash: '33539f5b93e2da23417ad4b58cf988e3047024226bbff1880d8e7eed7ded2911',
      },
      file2x: {
        url: knightCardPicked2x,
        bytes: 381726,
        hash: '644238fe7aedd2b9466284e8938fe91b0a7241b1b6a288df0947a1809cabae5b',
      },
      box: { left: 803, top: 210, width: 314, height: 660 },
    },
    'refraction-idle': {
      file: {
        url: knightRefractionIdle,
        bytes: 106466,
        hash: '261e425b6c80f32ed3bf290de801bf2bf1e1060b4f0b3a99d6bad323f45b13a6',
      },
      file2x: {
        url: knightRefractionIdle2x,
        bytes: 363150,
        hash: 'a50bf3890783021517e1e81f208594d0e0084ca39581497380f7cf6a6354e023',
      },
      box: { left: 806, top: 226, width: 305, height: 620 },
    },
    'refraction-picked': {
      file: {
        url: knightRefractionPicked,
        bytes: 139044,
        hash: '32d61273c636b5e54e5bb2370c660aa834e6c00d2c22cd076e03620ddb3d0ede',
      },
      file2x: {
        url: knightRefractionPicked2x,
        bytes: 471438,
        hash: 'd31e1304761a1907544aabae7c12814e35e511991a37e1d45e86726ad661c953',
      },
      box: { left: 778, top: 181, width: 355, height: 699 },
    },
    'legend-mini': {
      file: {
        url: knightLegendMini,
        bytes: 15118,
        hash: '53216c179ba2afe93e0a46e1b2810fea0e43caabe99966af2cfa3f570396dc57',
      },
      file2x: {
        url: knightLegendMini2x,
        bytes: 49614,
        hash: '2e0cd044fcab17222ea24d423558f4742a7fed6e7ddf1b008ffdd0575ab32e1b',
      },
      box: { left: 208, top: 804, width: 99, height: 134 },
    },
    'ally-tile': {
      file: {
        url: knightAllyTile,
        bytes: 5632,
        hash: '55136a751a5e92568cb1cdb46c21b6e77200a88057b669ea69759ee8edf0ee77',
      },
      file2x: {
        url: knightAllyTile2x,
        bytes: 19430,
        hash: '175373c9c0131436922962e213734e71c94260ce1e589bb7d6affa24db8eb031',
      },
    },
    'player-tile-picked': {
      file: {
        url: knightPlayerTilePicked,
        bytes: 7402,
        hash: '63f97587142603d84660c2a1bf056c2319813dc567c4a9aed169011c46a41384',
      },
      file2x: {
        url: knightPlayerTilePicked2x,
        bytes: 25768,
        hash: '9bda29e64dfd21a17e1ef12e47941154a1dc81576b20d90dd76837793ae71be7',
      },
    },
  },
};
