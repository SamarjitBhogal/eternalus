import iconPlaceholderAperture from '../../assets/match/icons/icon-placeholder-aperture.webp';
import iconPlaceholderAperture2x from '../../assets/match/icons/icon-placeholder-aperture@2x.webp';
import iconPlaceholderAtom from '../../assets/match/icons/icon-placeholder-atom.webp';
import iconPlaceholderAtom2x from '../../assets/match/icons/icon-placeholder-atom@2x.webp';
import iconPlaceholderLinkBreak from '../../assets/match/icons/icon-placeholder-link-break.webp';
import iconPlaceholderLinkBreak2x from '../../assets/match/icons/icon-placeholder-link-break@2x.webp';
import iconPlaceholderMeteor from '../../assets/match/icons/icon-placeholder-meteor.webp';
import iconPlaceholderMeteor2x from '../../assets/match/icons/icon-placeholder-meteor@2x.webp';
import iconPlaceholderSword from '../../assets/match/icons/icon-placeholder-sword.webp';
import iconPlaceholderSword2x from '../../assets/match/icons/icon-placeholder-sword@2x.webp';
import magusWeaponStaff from '../../assets/match/classes/magus-weapon-staff.webp';
import magusWeaponStaff2x from '../../assets/match/classes/magus-weapon-staff@2x.webp';
import minimapFrame from '../../assets/match/hud/minimap-frame.webp';
import minimapFrame2x from '../../assets/match/hud/minimap-frame@2x.webp';
import warriorGadgetCourage from '../../assets/match/classes/warrior-gadget-courage.webp';
import warriorGadgetCourage2x from '../../assets/match/classes/warrior-gadget-courage@2x.webp';
import warriorHudEmblem from '../../assets/match/classes/warrior-hud-emblem.webp';
import warriorHudEmblem2x from '../../assets/match/classes/warrior-hud-emblem@2x.webp';
import warriorWeaponBattleAxe from '../../assets/match/classes/warrior-weapon-battle-axe.webp';
import warriorWeaponBattleAxe2x from '../../assets/match/classes/warrior-weapon-battle-axe@2x.webp';

import type { AssetManifestEntry } from './AssetManifest.types';

/** Part of the `match` group: the ability bar, gadget slots, level badge and minimap frame. */
export const MATCH_PANEL_ASSETS: readonly AssetManifestEntry[] = [
  {
    id: 'icon-placeholder-aperture',
    type: 'ui-image',
    group: 'match',
    file: {
      url: iconPlaceholderAperture,
      bytes: 698,
      hash: '3f7370f28f83da57222a3b9c8b6ccc1cbdadf473df974db77aec50c72442ba1e',
    },
    file2x: {
      url: iconPlaceholderAperture2x,
      bytes: 1306,
      hash: '6b3f5ff1395b28d96d30438b7c1ad6ae20f95a6c510173163c3bbcb75c6204d8',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:273 cropped to (320, 964, 60, 60), nothing removed',
  },
  {
    id: 'icon-placeholder-atom',
    type: 'ui-image',
    group: 'match',
    file: {
      url: iconPlaceholderAtom,
      bytes: 630,
      hash: '47d88b1a6699e659a3a6cc7af066c464ce2354798cbc731cdaebdb3d402b119a',
    },
    file2x: {
      url: iconPlaceholderAtom2x,
      bytes: 1254,
      hash: '0b9303ced0daf98554cf07dc7c116790dffa115bca7dc0527fa542fade9233a4',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:265 cropped to (166, 964, 60, 60), nothing removed',
  },
  {
    id: 'icon-placeholder-link-break',
    type: 'ui-image',
    group: 'match',
    file: {
      url: iconPlaceholderLinkBreak,
      bytes: 406,
      hash: '71233857cd9d0516bb3e83d5b15b737bfc3acd12c2ea89b5d037d987d77c7b11',
    },
    file2x: {
      url: iconPlaceholderLinkBreak2x,
      bytes: 762,
      hash: '58c4d9b1cc9029298c48674b329c057666b4ddfcd7360d62ed317417a776de81',
    },
    licence: 'mit-phosphor',
    source:
      'Phosphor Icons glyph (MIT): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:269 cropped to (244, 964, 60, 60), nothing removed',
  },
  {
    id: 'icon-placeholder-meteor',
    type: 'ui-image',
    group: 'match',
    file: {
      url: iconPlaceholderMeteor,
      bytes: 10956,
      hash: 'f6339c511feb078d286ecdfa744820149a123b4651e0301b755fd1e492950e61',
    },
    file2x: {
      url: iconPlaceholderMeteor2x,
      bytes: 35118,
      hash: 'db2617893d8475d764b77895745f813bf458301000f2031d183864f12749d704',
    },
    licence: 'mit-phosphor',
    source:
      "Phosphor Icons Meteor glyph (MIT) with the owner's glow and inner shadow: Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 62:248 (frame clips its glow) cropped to (74, 948, 80, 80), nothing removed",
  },
  {
    id: 'icon-placeholder-sword',
    type: 'ui-image',
    group: 'match',
    file: {
      url: iconPlaceholderSword,
      bytes: 9138,
      hash: '27faa3ae94e02c1979148f5c946ad255fd359f491fe5ed62ec44bbbce2a231ad',
    },
    file2x: {
      url: iconPlaceholderSword2x,
      bytes: 28190,
      hash: 'e3faeeb698c33c47f3e114cf06155337c7df21f2ba64cb6022b4dacf55991480',
    },
    licence: 'mit-phosphor',
    source:
      "Phosphor Icons Sword glyph (MIT) with the owner's glints: Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:710 (sword 65:675 + glints 65:707) cropped to (1768, 937, 127, 127), nothing removed",
  },
  {
    id: 'magus-weapon-staff',
    type: 'ui-image',
    group: 'match',
    file: {
      url: magusWeaponStaff,
      bytes: 1162,
      hash: '511158f984939bbfbc2cc0f37bfcca9ffc7640b439fb5eae3cc85909be9a8642',
    },
    file2x: {
      url: magusWeaponStaff2x,
      bytes: 2924,
      hash: '3ed010c0794ed4ce666ce9a2704358f686011e09cc55bec1bafa2b2915ec6472',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): a pixel copy of magus-detail-staff@detail-class-alt (Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:70, node 62:103 rotated 90 degrees, R1 render on scratch duplicate 96:150 of page 96:2, black/white frame-fill pair r1-log W11/W12, straight alpha a = 1 - (W - B)/255, colour B/a, nothing removed), lossless WebP; in the match group so the HUD never needs released selection files (OD-8)',
  },
  {
    id: 'minimap-frame',
    type: 'ui-image',
    group: 'match',
    file: {
      url: minimapFrame,
      bytes: 38222,
      hash: 'eec9d70ad1a1325b029e384923723747acb5b7a7ed249cd62e9c02071ee7007d',
    },
    file2x: {
      url: minimapFrame2x,
      bytes: 105364,
      hash: '956b6514ca7d5bac832b264903463a29e12d83812a16588627d4bfc21a28781c',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:743 cropped to (1616, 27, 295, 284), nothing removed, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'warrior-gadget-courage',
    type: 'ui-image',
    group: 'match',
    file: {
      url: warriorGadgetCourage,
      bytes: 3286,
      hash: 'db525de66e02dda5ac2b2b9b9bd3a89dbb11fb2efc674091996dbd91e7c78f3a',
    },
    file2x: {
      url: warriorGadgetCourage2x,
      bytes: 10124,
      hash: '0a7301fccea1a4057408d687984d96ef00392331d1cf40a98fa7d2b124c13abe',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1b: black/white frame-fill pair (r1-log W27/W28); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:672 cropped to (1674, 937, 127, 127), nothing removed',
  },
  {
    id: 'warrior-hud-emblem',
    type: 'ui-image',
    group: 'match',
    file: {
      url: warriorHudEmblem,
      bytes: 25414,
      hash: '333b8278d2d587fdeb650af15d96b715870144a1160ff8d503ad091a642818f4',
    },
    file2x: {
      url: warriorHudEmblem2x,
      bytes: 31286,
      hash: '6cb1fc309459cd93faba4441ace4d9b8e6445d296790f161ee440131acf3de4d',
    },
    licence: 'owner',
    source:
      'Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs frame 62:231, protocol R1 render (OA1) on scratch duplicate 96:331 of page 96:2; pass hud-P1a: black/white frame-fill pair (r1-log W25/W26); straight alpha a = 1 - (W - B)/255, colour B/a; 1x lossless WebP. file = 65:645 cropped to (49, 772, 134, 135), nothing removed, 2x lossy q92 (alpha lossless)',
  },
  {
    id: 'warrior-weapon-battle-axe',
    type: 'ui-image',
    group: 'match',
    file: {
      url: warriorWeaponBattleAxe,
      bytes: 14560,
      hash: 'ed90375b989909a9328af0e575e346da9ea53de86992373c6010c96d19a44b49',
    },
    file2x: {
      url: warriorWeaponBattleAxe2x,
      bytes: 49424,
      hash: 'a0ccf168a449648c288331de808cc854c548ab9c5c8e4a0dafd65d5dcf3b7f8d',
    },
    licence: 'owner',
    source:
      "Owner art (DEC-51): Figma z5Udjg41B9Vtcb9IJHHyTs node 62:241 (rotated 90°, with the owner's Noise effect) in frame 62:231, 2026-10-24 (OD-23, OD-28). Alpha: protocol R1 (OA1) on scratch copy 140:3 in frame 140:2 of page 96:2, black/white frame-fill pair at scale 1 and 2, a = 1 - (W - B)/255. Colour: where a >= 0.5, solved from the original frame render over its #3e2217 fill, C = (F - (1 - a) * #3e2217) / a (F = 62:231 at scale 1 and 2), because a copy re-seeds the Noise grain; elsewhere B/a. Crop (387, 946, 274, 82); 1x and 2x lossless WebP. Re-extract after any edit to 62:241",
  },
];
