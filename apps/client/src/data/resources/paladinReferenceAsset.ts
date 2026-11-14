import type { AssetManifestEntry } from './AssetManifest.types';
import base from '../../assets/selection/legends/paladin-reference-art.webp';
import base2x from '../../assets/selection/legends/paladin-reference-art@2x.webp';
import paladinCardIdle from '../../assets/selection/legends/paladin-reference-art@card-idle.webp';
import paladinCardIdle2x from '../../assets/selection/legends/paladin-reference-art@card-idle@2x.webp';
import paladinCardPicked from '../../assets/selection/legends/paladin-reference-art@card-picked.webp';
import paladinCardPicked2x from '../../assets/selection/legends/paladin-reference-art@card-picked@2x.webp';
import paladinRefractionIdle from '../../assets/selection/legends/paladin-reference-art@refraction-idle.webp';
import paladinRefractionIdle2x from '../../assets/selection/legends/paladin-reference-art@refraction-idle@2x.webp';
import paladinRefractionPicked from '../../assets/selection/legends/paladin-reference-art@refraction-picked.webp';
import paladinRefractionPicked2x from '../../assets/selection/legends/paladin-reference-art@refraction-picked@2x.webp';
import paladinLegendMini from '../../assets/selection/legends/paladin-reference-art@legend-mini.webp';
import paladinLegendMini2x from '../../assets/selection/legends/paladin-reference-art@legend-mini@2x.webp';
import paladinAllyTile from '../../assets/selection/legends/paladin-reference-art@ally-tile.webp';
import paladinAllyTile2x from '../../assets/selection/legends/paladin-reference-art@ally-tile@2x.webp';
import paladinPlayerTilePicked from '../../assets/selection/legends/paladin-reference-art@player-tile-picked.webp';
import paladinPlayerTilePicked2x from '../../assets/selection/legends/paladin-reference-art@player-tile-picked@2x.webp';
/** User-authorised paladin selection art at the existing layout's native boxes. */
export const PALADIN_REFERENCE_ASSET: AssetManifestEntry = {
  id: 'paladin-reference-art',
  attachmentReferenceId: 'paladin-reference',
  type: 'ui-image',
  group: 'selection',
  licence: 'user-authorised-art',
  source:
    'User-provided ayqniwg53.webp; permission to use and adapt confirmed by Gurshaan 2026-11-12; native-size selection renditions; see docs/reference/legend-sprite-provenance.md',
  file: {
    url: base,
    bytes: 68286,
    hash: 'c477bd6b3f01df79437e87f657814718b6a2b09f148de67c23eef83763abfe58',
  },
  file2x: {
    url: base2x,
    bytes: 230940,
    hash: '0f1d6f98be51cbf35b68e7ef7e4f85745bc110a3f0caec1d6a8e47d6e6bdb7ca',
  },
  renditions: {
    'card-idle': {
      file: {
        url: paladinCardIdle,
        bytes: 84680,
        hash: 'ead0a48447a2bfdf01dad2113ef10828d3882ea9e90eae36d6f96b4fc522ea78',
      },
      file2x: {
        url: paladinCardIdle2x,
        bytes: 269534,
        hash: 'b7a47d35b21989cf28c29916f750e1fae15a98f9474ea943780764c8bac321ee',
      },
      box: { left: 1149, top: 256, width: 266, height: 568 },
    },
    'card-picked': {
      file: {
        url: paladinCardPicked,
        bytes: 110610,
        hash: '7ad53350bfde892dbba92e826bf4641ab6532f3891e60501da25668c769fe213',
      },
      file2x: {
        url: paladinCardPicked2x,
        bytes: 358536,
        hash: 'cb829e09928410bd3f048afeb1f8155ed16dd5ca1a7bf949de47f5564324d8bb',
      },
      box: { left: 1125, top: 210, width: 314, height: 660 },
    },
    'refraction-idle': {
      file: {
        url: paladinRefractionIdle,
        bytes: 108210,
        hash: '1790ae71fe810aa1731cce0ace0550fbb456a588204517313ea69cfec8965b21',
      },
      file2x: {
        url: paladinRefractionIdle2x,
        bytes: 341496,
        hash: 'bcb205926ce64a03ca41eb32f0ac364568f75f643485816b5a1207f021c436a1',
      },
      box: { left: 1128, top: 227, width: 305, height: 620 },
    },
    'refraction-picked': {
      file: {
        url: paladinRefractionPicked,
        bytes: 134120,
        hash: '254da4e4c02b97c081bde34c06ab53b9c367d599655429d5009fced50a949df5',
      },
      file2x: {
        url: paladinRefractionPicked2x,
        bytes: 443244,
        hash: 'b2614d0ea5675afc17720af16d3cda7c7abd8c9310b5a4957aed229bf9196e8b',
      },
      box: { left: 1101, top: 181, width: 355, height: 699 },
    },
    'legend-mini': {
      file: {
        url: paladinLegendMini,
        bytes: 15692,
        hash: 'db9b5a8987344ed27c89027bed773911489e01827cc2a9813efd62479baf914c',
      },
      file2x: {
        url: paladinLegendMini2x,
        bytes: 48590,
        hash: 'bdb51b9ad2fd32c7a7d1eaf0f3cf74c5d66670942280d84acb43464eea77717d',
      },
      box: { left: 342, top: 804, width: 99, height: 134 },
    },
    'ally-tile': {
      file: {
        url: paladinAllyTile,
        bytes: 4638,
        hash: '7a47f945a6bc61083f29fe14aa1ff70308a9482b6ee862874ac3f449b295dac7',
      },
      file2x: {
        url: paladinAllyTile2x,
        bytes: 17746,
        hash: 'ea6babe6f88e550188a415f7faf6250edb4b3c9011a40a1b60aee732b1c0f93b',
      },
    },
    'player-tile-picked': {
      file: {
        url: paladinPlayerTilePicked,
        bytes: 6390,
        hash: '5b3e000b8d50448507539b1ed004f890d313d27968890d551a2b2b0a7b6f6d90',
      },
      file2x: {
        url: paladinPlayerTilePicked2x,
        bytes: 21300,
        hash: 'd2d8476261d769fe9015fdaf7f8d5e81217fb0f65d714e4bdfd7b0c7aa0ce077',
      },
    },
  },
};
