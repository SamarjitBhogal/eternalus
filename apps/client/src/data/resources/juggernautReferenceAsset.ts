import type { AssetManifestEntry } from './AssetManifest.types';
import base from '../../assets/selection/legends/juggernaut-reference-art.webp';
import base2x from '../../assets/selection/legends/juggernaut-reference-art@2x.webp';
import juggernautCardIdle from '../../assets/selection/legends/juggernaut-reference-art@card-idle.webp';
import juggernautCardIdle2x from '../../assets/selection/legends/juggernaut-reference-art@card-idle@2x.webp';
import juggernautCardPicked from '../../assets/selection/legends/juggernaut-reference-art@card-picked.webp';
import juggernautCardPicked2x from '../../assets/selection/legends/juggernaut-reference-art@card-picked@2x.webp';
import juggernautRefractionIdle from '../../assets/selection/legends/juggernaut-reference-art@refraction-idle.webp';
import juggernautRefractionIdle2x from '../../assets/selection/legends/juggernaut-reference-art@refraction-idle@2x.webp';
import juggernautRefractionPicked from '../../assets/selection/legends/juggernaut-reference-art@refraction-picked.webp';
import juggernautRefractionPicked2x from '../../assets/selection/legends/juggernaut-reference-art@refraction-picked@2x.webp';
import juggernautLegendMini from '../../assets/selection/legends/juggernaut-reference-art@legend-mini.webp';
import juggernautLegendMini2x from '../../assets/selection/legends/juggernaut-reference-art@legend-mini@2x.webp';
import juggernautAllyTile from '../../assets/selection/legends/juggernaut-reference-art@ally-tile.webp';
import juggernautAllyTile2x from '../../assets/selection/legends/juggernaut-reference-art@ally-tile@2x.webp';
import juggernautPlayerTilePicked from '../../assets/selection/legends/juggernaut-reference-art@player-tile-picked.webp';
import juggernautPlayerTilePicked2x from '../../assets/selection/legends/juggernaut-reference-art@player-tile-picked@2x.webp';
/** User-authorised juggernaut selection art at the existing layout's native boxes. */
export const JUGGERNAUT_REFERENCE_ASSET: AssetManifestEntry = {
  id: 'juggernaut-reference-art',
  attachmentReferenceId: 'juggernaut-reference',
  type: 'ui-image',
  group: 'selection',
  licence: 'user-authorised-art',
  source:
    'User-provided 3a3b993770906ed01544422b12c6fb37.jpg; printed credit https://www.artstation.com/jsraphael; copyright 2021 Arackhan Wars, Nothing But Dreams; permission to use and adapt confirmed by Gurshaan 2026-11-12; native-size selection renditions; see docs/reference/legend-sprite-provenance.md',
  file: {
    url: base,
    bytes: 67286,
    hash: 'e7f4503e8891b44304026c4f2c3f87a0daeb853421eff1ccf60ef20d745e3f9d',
  },
  file2x: {
    url: base2x,
    bytes: 210846,
    hash: '312847eb76ab1de0c22efd1c0dabf63aab13fa7768c0aaddbec77d1b69b27da4',
  },
  renditions: {
    'card-idle': {
      file: {
        url: juggernautCardIdle,
        bytes: 73040,
        hash: 'd3fdf4203de742c22ea71227e7e7f5f22074fd8867cfd207b1d3cdc022b901f3',
      },
      file2x: {
        url: juggernautCardIdle2x,
        bytes: 239266,
        hash: '82f2ba15b7bab028233e419b845672ad2f54dbf46b10bc88e124ba93b40810a8',
      },
      box: { left: 987, top: 255, width: 266, height: 568 },
    },
    'card-picked': {
      file: {
        url: juggernautCardPicked,
        bytes: 96576,
        hash: 'd1cc50207c302efb1cdfda8ec3f4c07daf20c5c91998c1b0d062574d6109a17b',
      },
      file2x: {
        url: juggernautCardPicked2x,
        bytes: 318060,
        hash: '96eca4f928cede2e9939d77b74020066fbe90525a05afb21bcac5d18580efc65',
      },
      box: { left: 964, top: 210, width: 314, height: 660 },
    },
    'refraction-idle': {
      file: {
        url: juggernautRefractionIdle,
        bytes: 92274,
        hash: '755bf03c815fa9e525dec77c6be0fb78391bbe4ae3272e5dc5cc2288c7cfe1b5',
      },
      file2x: {
        url: juggernautRefractionIdle2x,
        bytes: 303028,
        hash: '5e1360d311603ffac3a9b4a3aefb591c25ef456253be3329b9f857545414d0ee',
      },
      box: { left: 967, top: 226, width: 305, height: 620 },
    },
    'refraction-picked': {
      file: {
        url: juggernautRefractionPicked,
        bytes: 117794,
        hash: '7795f44001cf031f226c66ab1198c44ea1fd031a929c71c39367dd649e36dc26',
      },
      file2x: {
        url: juggernautRefractionPicked2x,
        bytes: 386368,
        hash: '260642c11c2202ffe158bf2b9a546f9bcf6617a31a8429d2696df7729b094cce',
      },
      box: { left: 939, top: 181, width: 355, height: 699 },
    },
    'legend-mini': {
      file: {
        url: juggernautLegendMini,
        bytes: 13962,
        hash: 'a644f9d6bd8f1ac33336f95665cdd05cf526f905de3259d3146fd530c4678d06',
      },
      file2x: {
        url: juggernautLegendMini2x,
        bytes: 44418,
        hash: 'f59248ae46c934cfede29da6c7738d5e9ac68a5bfe14a54c92a52cce6c7a0b3a',
      },
      box: { left: 208, top: 804, width: 99, height: 134 },
    },
    'ally-tile': {
      file: {
        url: juggernautAllyTile,
        bytes: 5350,
        hash: '8618a5206f8d2e53f7ad45fb58858e699c049071197356d9fdaadaab32fe6f27',
      },
      file2x: {
        url: juggernautAllyTile2x,
        bytes: 18074,
        hash: '42f22489627149701c0d98c9e996b2c476c56ea98d792a7b582bbdb7bd84ff00',
      },
    },
    'player-tile-picked': {
      file: {
        url: juggernautPlayerTilePicked,
        bytes: 7010,
        hash: '25be7b6381084ffc61d3b742bbb52974626ed84548fa3f04cf7f0ad715433fd4',
      },
      file2x: {
        url: juggernautPlayerTilePicked2x,
        bytes: 23622,
        hash: '41ab3a4f96c23857558a4f8a6c4d51b4ed1fff9db01592bbbcba01326e900a01',
      },
    },
  },
};
