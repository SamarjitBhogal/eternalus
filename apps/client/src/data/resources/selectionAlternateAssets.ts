import magusDetailArcaneIntellectFlame from '../../assets/selection-alternate/details/magus-detail-arcane-intellect-flame.webp';
import magusDetailArcaneIntellectFlame2x from '../../assets/selection-alternate/details/magus-detail-arcane-intellect-flame@2x.webp';
import magusModel from '../../assets/selection-alternate/classes/magus-model.webp';
import magusModel2x from '../../assets/selection-alternate/classes/magus-model@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * The `selection-alternate` group: art that only the alternate class-step layout draws
 * (14 §14; DEC-52).
 */
export const SELECTION_ALTERNATE_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'magus-detail-arcane-intellect-flame',
    type: 'ui-image',
    group: 'selection-alternate',
    file: {
      url: magusDetailArcaneIntellectFlame,
      bytes: 1724,
      hash: 'ec8f12a667ca00df42399e5da011fa4a2dd4e3f64932d9250d204a875601a91d',
    },
    file2x: {
      url: magusDetailArcaneIntellectFlame2x,
      bytes: 4470,
      hash: '4a2dc2d4630eef3e9194791aab16ef41f593381c7bf154d87e5d556a133f2b7f',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:70, protocol R1 render (OA1) on scratch duplicate 96:150 of page 96:2; pass alt-P1-nonglass: black/white frame-fill pair (r1-log W11/W12); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:97 cropped to (154, 653, 44, 78), nothing removed',
  },
  {
    id: 'magus-model',
    type: 'ui-image',
    group: 'selection-alternate',
    file: {
      url: magusModel,
      bytes: 454300,
      hash: 'e4f563c408d7f55f51e3adae32e301c9b222e991fb41aa5c772bbe979550c8bc',
    },
    file2x: {
      url: magusModel2x,
      bytes: 583010,
      hash: '04ebb0b0c63c6795634742828ffec733699ba64d2f62d42473ed0abc641d653c',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:70, protocol R1 render (OA1) on scratch duplicate 96:150 of page 96:2; pass alt-P1-nonglass: black/white frame-fill pair (r1-log W11/W12); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:77 cropped to (436, 165, 1048, 747), nothing removed, 2x lossy q92 (alpha lossless). S5 winner: the R1 render with its drop shadow (0, 4, blur 20, 60 % black) baked (no live shadow); the Magus model is a Tripo Studio render by the owner',
  },
];
