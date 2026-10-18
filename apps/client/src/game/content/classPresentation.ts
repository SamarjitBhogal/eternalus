// Class and Legend presentation (Figma 62:125, 62:70, 58:271): accents, art, plates and detail
// icons by content id. Names, titles and copy come from core; art is keyed by spec id, never by a
// Legend name, because names differ by team (I-82, I-83).
import type { LegendClassCard, LegendSpecArt } from '../../bridge/catalogue.types';
import type { ClassPresentation, SpecPresentation } from './CataloguePresentation.types';
import { MAGUS_HUD, SENTINEL_HUD, WARRIOR_HUD } from './hudPresentation';

/** 62:82 verbatim, with its hard line breaks (each line ends with a space; DV-114, HC-Q5). */
const MAGUS_ALTERNATE_DESCRIPTION =
  'The masters of Aether, Magus focus on the use of \n' +
  'abilities, while providing buffs for allies, and de-buffing \n' +
  'enemy units. Specializing in ranged attacks, Magus \n' +
  'aim to keep their distance from enemies to dish out \n' +
  'damage with high sustain. ';

/** Keyed by core class id. Plates are present on both renderers; `'css'` empties them (I-80). */
export const CLASS_PRESENTATION: Readonly<Record<string, ClassPresentation>> = {
  warrior: {
    accentToken: '--class-warrior-accent',
    art: {
      card: 'warrior-card-art',
      sigil: 'warrior-sigil',
      model: null,
      cardPlates: { idle: 'warrior-card-plate-idle' },
      rowPlate: null,
    },
    detailIcons: {},
    hud: WARRIOR_HUD,
    layoutOverrides: {},
  },
  sentinel: {
    accentToken: '--class-sentinel-accent',
    art: {
      card: 'sentinel-card-art',
      sigil: 'sentinel-sigil',
      model: null,
      cardPlates: { idle: 'sentinel-card-plate-idle' },
      rowPlate: null,
    },
    detailIcons: {},
    hud: SENTINEL_HUD,
    layoutOverrides: {},
  },
  magus: {
    accentToken: '--class-magus-accent',
    art: {
      card: 'magus-card-art',
      sigil: 'magus-sigil',
      model: 'magus-model',
      cardPlates: { picked: 'magus-card-plate-picked' },
      rowPlate: 'class-row-plate-magus',
    },
    detailIcons: {
      signature: 'magus-detail-aetheric-recall',
      proficiency: 'magus-detail-staff',
      specialty: 'magus-detail-arcane-intellect',
    },
    hud: MAGUS_HUD,
    layoutOverrides: {
      alternate: {
        description: MAGUS_ALTERNATE_DESCRIPTION,
        detailIcons: { specialty: 'magus-detail-arcane-intellect-flame' },
      },
    },
  },
};

/**
 * The locked fourth card (DEC-48: shown, never selectable, never given to a bot). Content id
 * `flying` as architecture 04 §2 and 17 R1 reserve it (INBOX HC-F2); "aerial" lower case as in
 * 72:861; the blurb is reference 01's Flying row.
 */
export const LOCKED_CLASSES: readonly LegendClassCard[] = [
  {
    // TODO(sam): becomes core content with the Flying class (17 R1).
    classId: 'flying',
    displayName: 'Harbinger',
    blurb: 'Air-based; moves primarily in the air, like a jet or helicopter.',
    status: 'locked',
    roleLabel: 'aerial',
    tagline: null,
    description: null,
    accentToken: '--class-flying-accent',
    details: [
      { slot: 'signature', displayName: null, iconAssetId: null },
      { slot: 'proficiency', displayName: null, iconAssetId: null },
      { slot: 'specialty', displayName: null, iconAssetId: null },
    ],
    art: {
      card: 'flying-card-art',
      sigil: 'flying-sigil',
      model: null,
      cardPlates: { idle: 'flying-card-plate-idle' },
      rowPlate: null,
    },
    specs: [],
    hud: null,
    layoutOverrides: {},
  },
];

/** A Legend with no art of its own: the designed placeholders. */
const NO_LEGEND_ART: LegendSpecArt = {
  card: null,
  refraction: null,
  portrait: null,
  mini: null,
  rowPlate: null,
};

/** The Legionnaire Legends share the class stand-in portrait until their art exists (OA3). */
const LEGIONNAIRE_LEGEND: SpecPresentation = {
  status: 'available',
  accentToken: '--class-warrior-accent',
  art: { ...NO_LEGEND_ART, portrait: 'legionnaire-legend-portrait' },
  detailIcons: {},
};

/** The Sentinel Legends draw the designed placeholders (OA3: no art yet). */
const SENTINEL_LEGEND: SpecPresentation = {
  status: 'available',
  accentToken: '--class-sentinel-accent',
  art: NO_LEGEND_ART,
  detailIcons: {},
};

/** Keyed by core spec id; every Legend is selectable (I-11, I-82). */
export const SPEC_PRESENTATION: Readonly<Record<string, SpecPresentation>> = {
  assassin: LEGIONNAIRE_LEGEND,
  knight: LEGIONNAIRE_LEGEND,
  paladin: LEGIONNAIRE_LEGEND,
  colossus: SENTINEL_LEGEND,
  juggernaut: SENTINEL_LEGEND,
  catalyst: {
    status: 'available',
    accentToken: '--legend-catalyst-accent',
    art: {
      ...NO_LEGEND_ART,
      card: 'catalyst-card-art',
      portrait: 'catalyst-portrait',
      mini: 'catalyst-mini',
    },
    detailIcons: {},
  },
  oracle: {
    status: 'available',
    accentToken: '--legend-oracle-accent',
    art: {
      card: 'oracle-card-art',
      refraction: 'oracle-refraction-art',
      portrait: 'oracle-portrait',
      mini: 'oracle-mini',
      rowPlate: 'oracle-row-plate',
    },
    detailIcons: {
      signature: 'magus-detail-aetheric-recall',
      specialty: 'oracle-detail-unison-ward',
      ultimate: 'oracle-detail-severed-accord',
    },
  },
  necromancer: {
    status: 'available',
    accentToken: '--legend-necromancer-accent',
    art: {
      ...NO_LEGEND_ART,
      card: 'necromancer-card-art',
      portrait: 'necromancer-portrait',
      mini: 'necromancer-mini',
    },
    detailIcons: {},
  },
};
