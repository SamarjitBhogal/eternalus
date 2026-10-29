import catalystMiniLegendMini from '../../assets/selection-primary/legends/catalyst-mini@legend-mini.webp';
import catalystMiniLegendMini2x from '../../assets/selection-primary/legends/catalyst-mini@legend-mini@2x.webp';
import harbingerCardArt from '../../assets/selection-primary/classes/harbinger-card-art.webp';
import magusCardArt from '../../assets/selection-primary/classes/magus-card-art.webp';
import magusDetailArcaneIntellectDetailClass from '../../assets/selection-primary/details/magus-detail-arcane-intellect@detail-class.webp';
import magusDetailArcaneIntellectDetailClass2x from '../../assets/selection-primary/details/magus-detail-arcane-intellect@detail-class@2x.webp';
import necromancerMiniLegendMini from '../../assets/selection-primary/legends/necromancer-mini@legend-mini.webp';
import necromancerMiniLegendMini2x from '../../assets/selection-primary/legends/necromancer-mini@legend-mini@2x.webp';
import oracleMiniLegendMini from '../../assets/selection-primary/legends/oracle-mini@legend-mini.webp';
import oracleMiniLegendMini2x from '../../assets/selection-primary/legends/oracle-mini@legend-mini@2x.webp';
import sentinelCardArt from '../../assets/selection-primary/classes/sentinel-card-art.webp';
import warriorCardArt from '../../assets/selection-primary/classes/warrior-card-art.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/**
 * The `selection-primary` group: art that only the primary class-step layout draws (14 §14;
 * DEC-52).
 */
export const SELECTION_PRIMARY_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'catalyst-mini',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: catalystMiniLegendMini,
      bytes: 16074,
      hash: 'a096d9d5bfcfc7f1abb2c7b019b4e930e70260d4bb1459887ecb3a1d2e877ca7',
    },
    file2x: {
      url: catalystMiniLegendMini2x,
      bytes: 52256,
      hash: '2410b3e49f7f26e337110986b9805ac46d9bbf8ad6d87f8701d0ff7b3f39c87a',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. legend-mini = 72:803 (Figma: Veridan) cropped to (70, 803, 102, 137) (fractional box (70.5, 803.47, 101, 136.03) baked), nothing removed',
    renditions: {
      'legend-mini': {
        file: {
          url: catalystMiniLegendMini,
          bytes: 16074,
          hash: 'a096d9d5bfcfc7f1abb2c7b019b4e930e70260d4bb1459887ecb3a1d2e877ca7',
        },
        file2x: {
          url: catalystMiniLegendMini2x,
          bytes: 52256,
          hash: '2410b3e49f7f26e337110986b9805ac46d9bbf8ad6d87f8701d0ff7b3f39c87a',
        },
        box: { left: 70, top: 803, width: 102, height: 137 },
      },
    },
  },
  {
    id: 'harbinger-card-art',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: harbingerCardArt,
      bytes: 151310,
      hash: '4cd3dedb7a4c46e154089a131c7b87244c4199cd8d703591adc1d8a1e5d1238c',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, node 62:149 image fill; master wf1 figma-class-select/assets/class-card-art-harbinger.png (306x639, SHA-256 484c7e25ece3a27faee8193fe04c3a300a9651a46821de95de88e20bae223650), lossless WebP, not resampled (the live path, CD-15)',
  },
  {
    id: 'magus-card-art',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: magusCardArt,
      bytes: 184860,
      hash: '4f08296aa355f7f47b7d39f784221c91f67a620cdab1171c0b29a97251f47f42',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, node 62:154 image fill; master wf1 figma-class-select/assets/class-card-art-magus.png (319x639, SHA-256 8a52147916ab6179c08c7727b7317a25a20cf928d800427a33bc8975aa866bc1), lossless WebP, not resampled (the live path, CD-15)',
  },
  {
    id: 'magus-detail-arcane-intellect',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: magusDetailArcaneIntellectDetailClass,
      bytes: 696,
      hash: '4325c87b8d30d4143d50ef6402a133226c0fdc0eb4f9b3c76bf8eca7c464ea1a',
    },
    file2x: {
      url: magusDetailArcaneIntellectDetailClass2x,
      bytes: 1518,
      hash: '94e44c22830026727cd2688dcff8a2ea46acf96905e5d87bf4ae2ce652de6654',
    },
    licence: 'mit-phosphor',
    source:
      "The owner's head outline 72:778 with the Phosphor Icons Brain glyph 72:779 (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. detail-class = 72:866 (head 72:778 + Phosphor Brain 72:779) cropped to (133, 666, 54, 64) (fractional box (133.16, 666.41, 52.85, 62.67) baked), nothing removed",
    renditions: {
      'detail-class': {
        file: {
          url: magusDetailArcaneIntellectDetailClass,
          bytes: 696,
          hash: '4325c87b8d30d4143d50ef6402a133226c0fdc0eb4f9b3c76bf8eca7c464ea1a',
        },
        file2x: {
          url: magusDetailArcaneIntellectDetailClass2x,
          bytes: 1518,
          hash: '94e44c22830026727cd2688dcff8a2ea46acf96905e5d87bf4ae2ce652de6654',
        },
      },
    },
  },
  {
    id: 'necromancer-mini',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: necromancerMiniLegendMini,
      bytes: 15438,
      hash: 'ca1e49f032f5eaad2bd51cd52c6ced0195d8b88d09dfc99268070cd2d81e283d',
    },
    file2x: {
      url: necromancerMiniLegendMini2x,
      bytes: 48684,
      hash: '1fc17d7515484859857bac81a69389caf7bfc1f90f7ca325f6de81615abd1931',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. legend-mini = 72:797 (Figma: Avedrin) cropped to (341, 803, 102, 137) (fractional box (341.5, 803.47, 101, 136.03) baked), nothing removed',
    renditions: {
      'legend-mini': {
        file: {
          url: necromancerMiniLegendMini,
          bytes: 15438,
          hash: 'ca1e49f032f5eaad2bd51cd52c6ced0195d8b88d09dfc99268070cd2d81e283d',
        },
        file2x: {
          url: necromancerMiniLegendMini2x,
          bytes: 48684,
          hash: '1fc17d7515484859857bac81a69389caf7bfc1f90f7ca325f6de81615abd1931',
        },
        box: { left: 341, top: 803, width: 102, height: 137 },
      },
    },
  },
  {
    id: 'oracle-mini',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: oracleMiniLegendMini,
      bytes: 17994,
      hash: 'd843b69830f24aa0b9d9317e7ffdbb3344b7a0ee5897f378e30b31c362cd1284',
    },
    file2x: {
      url: oracleMiniLegendMini2x,
      bytes: 17436,
      hash: 'f256b7a96914c18a8d83153828b10a1994f361a7a543c4ba9706485a10b4e4bb',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, protocol R1 render (OA1) on scratch duplicate 96:3 of page 96:2; pass cs-P1-nonglass: black/white frame-fill pair (r1-log W9/W10); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. legend-mini = 72:791 (Figma: Elarion) cropped to (208, 804, 100, 135), nothing removed, 2x lossy q92 (alpha lossless)',
    renditions: {
      'legend-mini': {
        file: {
          url: oracleMiniLegendMini,
          bytes: 17994,
          hash: 'd843b69830f24aa0b9d9317e7ffdbb3344b7a0ee5897f378e30b31c362cd1284',
        },
        file2x: {
          url: oracleMiniLegendMini2x,
          bytes: 17436,
          hash: 'f256b7a96914c18a8d83153828b10a1994f361a7a543c4ba9706485a10b4e4bb',
        },
        box: { left: 208, top: 804, width: 100, height: 135 },
      },
    },
  },
  {
    id: 'sentinel-card-art',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: sentinelCardArt,
      bytes: 206158,
      hash: '11596b8f244edb2d719d14daec3b7d6ae4847fc0b6a5c53e1997ecb0f266b2ba',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, node 62:159 image fill; master wf1 figma-class-select/assets/class-card-art-sentinel.png (305x637, SHA-256 73ec575b1f5863d75b8eec6509e510c8381e3cfda32e8c9352e3de3691888fd0), lossless WebP, not resampled (the live path, CD-15)',
  },
  {
    id: 'warrior-card-art',
    type: 'ui-image',
    group: 'selection-primary',
    file: {
      url: warriorCardArt,
      bytes: 203384,
      hash: '9ea8a7871d3f0d92c6389d58008571e81815793282218a0a81365473f2547355',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:125, node 62:164 image fill; master wf1 figma-class-select/assets/class-card-art-legionnaire.png (305x637, SHA-256 9a59a65e776e57ceb37426c386a88d7ff256312b87a6d5f828dba63fc8d6c5b8), lossless WebP, not resampled (the live path, CD-15)',
  },
];
