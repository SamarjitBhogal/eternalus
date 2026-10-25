// Class and Legend presentation (Figma 62:125, 62:70, 58:271): accents, art, plates and detail
// icons by content id. Names, titles and copy come from core; art is keyed by spec id, never by a
// Legend name, because names differ by team (DEC-49).
import type { LegendSpecArt } from '../../bridge/catalogue.types';
import type {
  ClassPresentation,
  LockedClassPresentation,
  SpecPresentation,
} from './CataloguePresentation.types';
import { MAGUS_HUD, SENTINEL_HUD, WARRIOR_HUD } from './hudPresentation';

/** Keyed by core class id. Plates are present on both renderers; `'css'` empties them (DEC-54). */
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
      alternate: { detailIcons: { specialty: 'magus-detail-arcane-intellect-flame' } },
    },
  },
};

/**
 * The art and accent of each locked card, keyed by core locked-class id (DEC-48); its name, blurb
 * and role label are core content.
 */
export const LOCKED_CLASS_PRESENTATION: Readonly<Record<string, LockedClassPresentation>> = {
  flying: {
    accentToken: '--class-flying-accent',
    art: {
      card: 'flying-card-art',
      sigil: 'flying-sigil',
      model: null,
      cardPlates: { idle: 'flying-card-plate-idle' },
      rowPlate: null,
    },
  },
};

/** A Legend with no art of its own: the designed placeholders. */
const NO_LEGEND_ART: LegendSpecArt = {
  card: null,
  refraction: null,
  portrait: null,
  mini: null,
  rowPlate: null,
};

/** The Legionnaire Legends share the class stand-in portrait until their art exists (DEC-49). */
const LEGIONNAIRE_LEGEND: SpecPresentation = {
  status: 'available',
  accentToken: '--class-warrior-accent',
  art: { ...NO_LEGEND_ART, portrait: 'legionnaire-legend-portrait' },
  detailIcons: {},
};

/** The Sentinel Legends draw the designed placeholders (DEC-49: no art yet). */
const SENTINEL_LEGEND: SpecPresentation = {
  status: 'available',
  accentToken: '--class-sentinel-accent',
  art: NO_LEGEND_ART,
  detailIcons: {},
};

/** Keyed by core spec id; every Legend is selectable (DEC-49). */
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
