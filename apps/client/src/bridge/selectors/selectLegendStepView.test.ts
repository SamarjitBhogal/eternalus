import { describe, expect, it } from 'vitest';

import type { LegendClassCard } from '../catalogue.types';
import { classCardFixture, specCardFixture } from '../__fixtures__/catalogueFixtures';
import type { PlayableTeam } from '../domain.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { createAppStore } from '../store';
import { selectLegendStepView } from './selectLegendStepView';

const ORACLE_DETAILS = [
  { slot: 'signature', displayName: 'Aetheric Recall', iconAssetId: 'icon-a' },
  { slot: 'specialty', displayName: 'Unison Ward', iconAssetId: 'icon-b' },
  { slot: 'ultimate', displayName: 'Severed Accord', iconAssetId: 'icon-c' },
] as const;

const MAGUS = classCardFixture({
  classId: 'magus',
  displayName: 'Magus',
  specs: [
    specCardFixture({
      specId: 'catalyst',
      displayName: 'Catalyst',
      legendName: { light: 'Veridan', dark: 'Nadirev' },
      art: { card: 'catalyst-art', refraction: null, portrait: null, mini: null, rowPlate: null },
    }),
    specCardFixture({
      specId: 'oracle',
      displayName: 'Oracle',
      legendName: { light: 'Elarion', dark: 'Noirale' },
      roleLabel: 'Support',
      description: 'A voice of the Unison.',
      accentToken: '--legend-oracle-accent',
      // Fields in another order than the bars, so the view's own order shows.
      ratings: { control: 201 / 395, damage: 152 / 395, support: 333 / 395 },
      details: ORACLE_DETAILS,
      art: {
        card: 'oracle-art',
        refraction: 'oracle-refraction',
        portrait: null,
        mini: null,
        rowPlate: 'oracle-row-plate',
      },
    }),
    specCardFixture({ specId: 'necromancer', displayName: 'Necromancer', status: 'locked' }),
  ],
});
const WARRIOR = classCardFixture({
  classId: 'warrior',
  displayName: 'Legionnaire',
  specs: [specCardFixture({ specId: 'knight', displayName: 'Centurion' })],
});
const LOCKED_ONLY = classCardFixture({
  classId: 'sentinel',
  specs: [specCardFixture({ specId: 'colossus', status: 'locked' })],
});
const NO_LEGENDS = classCardFixture({ classId: 'flying' });

function storeWith(
  selection: { readonly classId: string; readonly specId: string | null } | null,
  team: PlayableTeam = 'light',
  legendClasses: readonly LegendClassCard[] = [MAGUS, WARRIOR, LOCKED_ONLY, NO_LEGENDS],
) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({ ...contentSlice.getInitialState(), legendClasses }),
  );
  store.dispatch(matchSetupSlice.actions.setTeam({ seed: 1, playerTeam: team }));
  store.dispatch(matchSetupSlice.actions.select(selection));
  return store;
}

const viewOf = (...args: Parameters<typeof storeWith>) =>
  selectLegendStepView(storeWith(...args).getState());

describe('selectLegendStepView', () => {
  it('is null on the class step and for a class the catalogue lacks', () => {
    expect(viewOf(null)).toBeNull();
    expect(viewOf({ classId: 'druid', specId: null })).toBeNull();
  });

  it('lists the class Legends in content order and marks the pick', () => {
    const view = viewOf({ classId: 'magus', specId: 'oracle' });

    expect(view?.classId).toBe('magus');
    expect(view?.classDisplayName).toBe('Magus');
    expect(view?.pickedSpecId).toBe('oracle');
    expect(view?.legends.map(({ specId, isPicked }) => [specId, isPicked])).toEqual([
      ['catalyst', false],
      ['oracle', true],
      ['necromancer', false],
    ]);
    expect(view?.legends.map((legend) => legend.isAvailable)).toEqual([true, true, false]);
  });

  it('carries the display data, with the refraction art falling back to the card art', () => {
    const [catalyst, oracle] = viewOf({ classId: 'magus', specId: 'oracle' })?.legends ?? [];

    expect(oracle).toMatchObject({
      subClassName: 'Oracle',
      roleLabel: 'Support',
      description: 'A voice of the Unison.',
      accentToken: '--legend-oracle-accent',
      cardArtAssetId: 'oracle-art',
      refractionArtAssetId: 'oracle-refraction',
      rowPlateAssetId: 'oracle-row-plate',
      details: ORACLE_DETAILS,
    });
    expect(catalyst?.refractionArtAssetId).toBe('catalyst-art');
    expect(catalyst?.rowPlateAssetId).toBeNull();
  });

  it('gives one rating per axis in bar order, null while the Legend is unrated', () => {
    const [catalyst, oracle] = viewOf({ classId: 'magus', specId: null })?.legends ?? [];

    expect(oracle?.ratings).toEqual([
      { axis: 'damage', value: 152 / 395 },
      { axis: 'support', value: 333 / 395 },
      { axis: 'control', value: 201 / 395 },
    ]);
    expect(catalyst?.ratings).toEqual([
      { axis: 'damage', value: null },
      { axis: 'support', value: null },
      { axis: 'control', value: null },
    ]);
  });

  it("names each Legend for the player's team; titles never change (OA3, I-83)", () => {
    const light = viewOf({ classId: 'magus', specId: 'oracle' }, 'light');
    const dark = viewOf({ classId: 'magus', specId: 'oracle' }, 'dark');

    expect(light?.legends.map((legend) => legend.legendName)).toEqual(['Veridan', 'Elarion', null]);
    expect(dark?.legends.map((legend) => legend.legendName)).toEqual(['Nadirev', 'Noirale', null]);
    expect(dark?.legends.map((legend) => legend.subClassName)).toEqual(
      light?.legends.map((legend) => legend.subClassName),
    );
    expect(viewOf({ classId: 'warrior', specId: null }, 'dark')?.legends[0]).toMatchObject({
      subClassName: 'Centurion',
      legendName: null,
    });
  });

  it('ignores a pick the class does not offer', () => {
    const view = viewOf({ classId: 'magus', specId: 'knight' });

    expect(view?.pickedSpecId).toBeNull();
    expect(view?.legends.some((legend) => legend.isPicked)).toBe(false);
  });

  it('enables LOCK IN by canConfirmSelection (I-12)', () => {
    expect(viewOf({ classId: 'magus', specId: 'oracle' })?.canLockIn).toBe(true);
    expect(viewOf({ classId: 'magus', specId: null })?.canLockIn).toBe(false);
    expect(viewOf({ classId: 'sentinel', specId: null })?.canLockIn).toBe(true);
    expect(viewOf({ classId: 'flying', specId: null })?.legends).toEqual([]);
    expect(viewOf({ classId: 'flying', specId: null })?.canLockIn).toBe(true);
  });

  it('keeps the same object after a countdown tick and builds a new one after a pick', () => {
    const store = storeWith({ classId: 'magus', specId: 'catalyst' });
    const before = selectLegendStepView(store.getState());

    store.dispatch(matchSetupSlice.actions.setCountdown(41_000));
    expect(selectLegendStepView(store.getState())).toBe(before);

    store.dispatch(matchSetupSlice.actions.select({ classId: 'magus', specId: 'oracle' }));
    expect(selectLegendStepView(store.getState())).not.toBe(before);
    expect(selectLegendStepView(store.getState())?.pickedSpecId).toBe('oracle');
  });
});
