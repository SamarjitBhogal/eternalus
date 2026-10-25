import { describe, expect, it } from 'vitest';

import { classCardFixture, specCardFixture } from '../__fixtures__/catalogueFixtures';
import type { ClassSelectLayout, DetailRow, DisplayCatalogue } from '../catalogue.types';
import type { PlayableTeam } from '../domain.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { createAppStore } from '../store';
import { selectClassPanel } from './selectClassPanel';

const SIGNATURE: DetailRow = {
  slot: 'signature',
  displayName: 'Aetheric Recall',
  iconAssetId: 'magus-detail-aetheric-recall',
};
const PROFICIENCY: DetailRow = {
  slot: 'proficiency',
  displayName: 'Staff Proficiency',
  iconAssetId: 'magus-detail-staff',
};
const PRIMARY_ROWS: readonly DetailRow[] = [
  SIGNATURE,
  PROFICIENCY,
  {
    slot: 'specialty',
    displayName: 'Arcane Intellect',
    iconAssetId: 'magus-detail-arcane-intellect',
  },
];

/** 62:70's flame specialty icon (DEC-52). */
const ALTERNATE_ROWS: readonly DetailRow[] = [
  SIGNATURE,
  PROFICIENCY,
  {
    slot: 'specialty',
    displayName: 'Arcane Intellect',
    iconAssetId: 'magus-detail-arcane-intellect-flame',
  },
];

const MAGUS = classCardFixture({
  classId: 'magus',
  displayName: 'Magus',
  description: 'With a mastery of Aether…',
  details: PRIMARY_ROWS,
  specs: [
    specCardFixture({
      specId: 'catalyst',
      displayName: 'Catalyst',
      legendName: { light: 'Veridan', dark: 'Nadirev' },
      art: { card: null, refraction: null, portrait: null, mini: 'catalyst-mini', rowPlate: null },
    }),
    specCardFixture({
      specId: 'oracle',
      displayName: 'Oracle',
      legendName: { light: 'Elarion', dark: 'Noirale' },
    }),
    specCardFixture({
      specId: 'necromancer',
      displayName: 'Necromancer',
      legendName: { light: 'Avedrin', dark: 'Nirdeva' },
    }),
  ],
  layoutOverrides: {
    alternate: { description: 'The masters of Aether, Magus focus on…', details: ALTERNATE_ROWS },
  },
});

const LEGIONNAIRE = classCardFixture({
  classId: 'warrior',
  displayName: 'Legionnaire',
  specs: [
    specCardFixture({ specId: 'assassin', displayName: 'Velite' }),
    specCardFixture({ specId: 'knight', displayName: 'Centurion' }),
    specCardFixture({ specId: 'paladin', displayName: 'Praetorian' }),
  ],
});

function storeWith(layout: ClassSelectLayout, team: PlayableTeam | null = 'light') {
  const content: DisplayCatalogue = {
    ...contentSlice.getInitialState(),
    legendClasses: [LEGIONNAIRE, MAGUS],
    classSelectLayout: layout,
  };
  return createAppStore({
    content,
    matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: team },
  });
}

describe('selectClassPanel', () => {
  it('shows the primary copy and rows untouched on the primary layout', () => {
    const panel = selectClassPanel(storeWith('primary').getState(), 'magus');

    expect(panel?.card).toBe(MAGUS);
    expect(panel?.description).toBe('With a mastery of Aether…');
    expect(panel?.details).toBe(PRIMARY_ROWS);
  });

  it("applies the alternate layout's description and flame icon (62:70)", () => {
    const panel = selectClassPanel(storeWith('alternate').getState(), 'magus');

    expect(panel?.description).toBe('The masters of Aether, Magus focus on…');
    expect(panel?.details.map((row) => row.iconAssetId)).toEqual([
      'magus-detail-aetheric-recall',
      'magus-detail-staff',
      'magus-detail-arcane-intellect-flame',
    ]);
  });

  it('keeps the card copy for a class with no override on the alternate layout', () => {
    const panel = selectClassPanel(storeWith('alternate').getState(), 'warrior');

    expect(panel?.description).toBeNull();
    expect(panel?.details).toEqual([]);
  });

  it('names the Legends strip for the light team (I-83)', () => {
    const panel = selectClassPanel(storeWith('primary', 'light').getState(), 'magus');

    expect(panel?.legendStrip.map((item) => item.name)).toEqual(['Veridan', 'Elarion', 'Avedrin']);
    expect(panel?.legendStrip[0]).toEqual({
      key: 'catalyst',
      name: 'Veridan',
      miniAssetId: 'catalyst-mini',
    });
  });

  it('names the Legends strip for the dark team (I-83)', () => {
    const panel = selectClassPanel(storeWith('primary', 'dark').getState(), 'magus');

    expect(panel?.legendStrip.map((item) => item.name)).toEqual(['Nadirev', 'Noirale', 'Nirdeva']);
  });

  it('titles unnamed Legends by their sub-class (OA3)', () => {
    const panel = selectClassPanel(storeWith('primary', 'dark').getState(), 'warrior');

    expect(panel?.legendStrip.map((item) => item.name)).toEqual([
      'Velite',
      'Centurion',
      'Praetorian',
    ]);
  });

  it('is undefined for a class the catalogue lacks, and for no class', () => {
    const state = storeWith('primary').getState();

    expect(selectClassPanel(state, 'flying')).toBeUndefined();
    expect(selectClassPanel(state, null)).toBeUndefined();
  });

  it('keeps the same object per class after a countdown tick and a read of another class', () => {
    const store = storeWith('primary');
    const magus = selectClassPanel(store.getState(), 'magus');

    selectClassPanel(store.getState(), 'warrior');
    store.dispatch(matchSetupSlice.actions.setCountdown(41_000));

    expect(selectClassPanel(store.getState(), 'magus')).toBe(magus);
  });
});
