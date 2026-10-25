/**
 * Test support: catalogue cards with neutral defaults, so a test names only the fields it is
 * about. Imported only by tests, `ui/testStore.tsx` and the visual harness, never by a module
 * `main.tsx` reaches (I-76).
 */
import type {
  ColourToken,
  LegendClassArt,
  LegendClassCard,
  LegendSpecArt,
  LegendSpecCard,
} from '../catalogue.types';

/** The accent every fixture card has unless the test gives one. */
const FIXTURE_ACCENT: ColourToken = '--class-magus-accent';

const NO_CLASS_ART: LegendClassArt = {
  card: null,
  sigil: null,
  model: null,
  cardPlates: {},
  rowPlate: null,
};

const NO_SPEC_ART: LegendSpecArt = {
  card: null,
  refraction: null,
  portrait: null,
  mini: null,
  rowPlate: null,
};

/** An available class card named after its id, with no art, details, Legends or HUD kit. */
export function classCardFixture(
  overrides: Partial<LegendClassCard> & Pick<LegendClassCard, 'classId'>,
): LegendClassCard {
  return {
    displayName: overrides.classId,
    blurb: '',
    status: 'available',
    roleLabel: '',
    tagline: null,
    description: null,
    accentToken: FIXTURE_ACCENT,
    details: [],
    art: NO_CLASS_ART,
    specs: [],
    hud: null,
    layoutOverrides: {},
    ...overrides,
  };
}

/** An available, unnamed Legend titled after its id, with no art, details or ratings. */
export function specCardFixture(
  overrides: Partial<LegendSpecCard> & Pick<LegendSpecCard, 'specId'>,
): LegendSpecCard {
  return {
    displayName: overrides.specId,
    legendName: null,
    roleLabel: null,
    description: null,
    status: 'available',
    accentToken: FIXTURE_ACCENT,
    ratings: null,
    details: [],
    art: NO_SPEC_ART,
    ...overrides,
  };
}
