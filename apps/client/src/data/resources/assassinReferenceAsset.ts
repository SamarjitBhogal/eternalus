import type { AssetManifestEntry } from './AssetManifest.types';
import base from '../../assets/selection/legends/assassin-reference-art.webp';
import base2x from '../../assets/selection/legends/assassin-reference-art@2x.webp';
import assassinCardIdle from '../../assets/selection/legends/assassin-reference-art@card-idle.webp';
import assassinCardIdle2x from '../../assets/selection/legends/assassin-reference-art@card-idle@2x.webp';
import assassinCardPicked from '../../assets/selection/legends/assassin-reference-art@card-picked.webp';
import assassinCardPicked2x from '../../assets/selection/legends/assassin-reference-art@card-picked@2x.webp';
import assassinRefractionIdle from '../../assets/selection/legends/assassin-reference-art@refraction-idle.webp';
import assassinRefractionIdle2x from '../../assets/selection/legends/assassin-reference-art@refraction-idle@2x.webp';
import assassinRefractionPicked from '../../assets/selection/legends/assassin-reference-art@refraction-picked.webp';
import assassinRefractionPicked2x from '../../assets/selection/legends/assassin-reference-art@refraction-picked@2x.webp';
import assassinLegendMini from '../../assets/selection/legends/assassin-reference-art@legend-mini.webp';
import assassinLegendMini2x from '../../assets/selection/legends/assassin-reference-art@legend-mini@2x.webp';
import assassinAllyTile from '../../assets/selection/legends/assassin-reference-art@ally-tile.webp';
import assassinAllyTile2x from '../../assets/selection/legends/assassin-reference-art@ally-tile@2x.webp';
import assassinPlayerTilePicked from '../../assets/selection/legends/assassin-reference-art@player-tile-picked.webp';
import assassinPlayerTilePicked2x from '../../assets/selection/legends/assassin-reference-art@player-tile-picked@2x.webp';
/** User-authorised assassin selection art at the existing layout's native boxes. */
export const ASSASSIN_REFERENCE_ASSET: AssetManifestEntry = {
  id: 'assassin-reference-art',
  attachmentReferenceId: 'assassin-reference',
  type: 'ui-image',
  group: 'selection',
  licence: 'user-authorised-art',
  source:
    'User-provided 8026e904-46be-4d2c-93ad-40812f27e23e.avif; permission to use and adapt confirmed by Gurshaan 2026-11-12; native-size selection renditions; see docs/reference/legend-sprite-provenance.md',
  file: {
    url: base,
    bytes: 106604,
    hash: '10828aa9607977d4dda5473405c3a791b7b0d6fac9924e3647eaacef32487b79',
  },
  file2x: {
    url: base2x,
    bytes: 299598,
    hash: 'ef49584da4f31754b1d05f079ec5ff3821f660c244b32c52a0e964f1ffbc6abf',
  },
  renditions: {
    'card-idle': {
      file: {
        url: assassinCardIdle,
        bytes: 117590,
        hash: '86588047c6f02b9c571396469444fb5e562ec0e1ea7e5f9d0d4d6a17e91c2803',
      },
      file2x: {
        url: assassinCardIdle2x,
        bytes: 326218,
        hash: '2f88fcf495f61baa03866caa7752c8bc684a1a83593b141656a25817bcad88d2',
      },
      box: { left: 505, top: 255, width: 266, height: 568 },
    },
    'card-picked': {
      file: {
        url: assassinCardPicked,
        bytes: 153098,
        hash: 'f745a2ea32888e6c875a33646678558bc28df10b266195fbd2cf5f3b009d5ab1',
      },
      file2x: {
        url: assassinCardPicked2x,
        bytes: 410322,
        hash: '51ca3b2f3239596b323821232dd4f73af069b60b2ba7e87087de04e5394e3b6b',
      },
      box: { left: 482, top: 210, width: 314, height: 660 },
    },
    'refraction-idle': {
      file: {
        url: assassinRefractionIdle,
        bytes: 146676,
        hash: '9928b59cb0ad9e254cc818b28189cca5a70e1c8c2eb26d5abb2d303840a74556',
      },
      file2x: {
        url: assassinRefractionIdle2x,
        bytes: 395082,
        hash: '157333aaf9684d36213b4344c762401566f78be97cd85ff4634850c7d7bceb4a',
      },
      box: { left: 485, top: 226, width: 305, height: 620 },
    },
    'refraction-picked': {
      file: {
        url: assassinRefractionPicked,
        bytes: 183326,
        hash: 'dd97609a5c88f6db0eb6bb2522c03fe2d853c208668a07ffd834bf6cf0e19941',
      },
      file2x: {
        url: assassinRefractionPicked2x,
        bytes: 481760,
        hash: 'e788ec1c7821dcc32996684956ce91389f5586fa03144aab896fd1a7d6bfc91b',
      },
      box: { left: 457, top: 181, width: 355, height: 699 },
    },
    'legend-mini': {
      file: {
        url: assassinLegendMini,
        bytes: 19820,
        hash: '34a52f3987c75e7b5d64c4cf195f35fe7fcd0171c73e8adada4df58a1b65ec83',
      },
      file2x: {
        url: assassinLegendMini2x,
        bytes: 64858,
        hash: '5ac1a88ecc76394d5f838a4facca42b8cb191f52f973bbc7932d09f78f8fe8bd',
      },
      box: { left: 71, top: 804, width: 99, height: 134 },
    },
    'ally-tile': {
      file: {
        url: assassinAllyTile,
        bytes: 4938,
        hash: '70777bada842d5864f5e668e65b351b41ebb3af1cb1edf30bc52a1d8b093e42d',
      },
      file2x: {
        url: assassinAllyTile2x,
        bytes: 16218,
        hash: '3b45061f2dfedd1cfec6d404eaf78a2d659c46297bb68592e560adc64892b9ee',
      },
    },
    'player-tile-picked': {
      file: {
        url: assassinPlayerTilePicked,
        bytes: 6422,
        hash: '8f36f3aad3cb5ee97fac29995282fd9ad806153a92067e3e391e723fb868d349',
      },
      file2x: {
        url: assassinPlayerTilePicked2x,
        bytes: 20950,
        hash: 'b086efbed05df7833047fe0e105ecc65b4fcbdfbdce834e26cbe0f166b421a1d',
      },
    },
  },
};
