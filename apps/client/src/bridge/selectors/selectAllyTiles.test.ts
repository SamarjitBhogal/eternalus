import { describe, expect, it } from 'vitest';

import type { LegendClassCard } from '../catalogue.types';
import { classCardFixture, specCardFixture } from '../catalogueFixtures';
import type { RosterEntry } from '../events';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { createAppStore } from '../store';
import { selectAllyTiles } from './selectAllyTiles';

const MAGUS = classCardFixture({
  classId: 'magus',
  displayName: 'Magus',
  accentToken: '--class-magus-accent',
  art: { card: null, sigil: 'magus-sigil', model: null, cardPlates: {}, rowPlate: null },
  specs: [
    specCardFixture({
      specId: 'oracle',
      accentToken: '--legend-oracle-accent',
      art: {
        card: null,
        refraction: null,
        portrait: 'oracle-portrait',
        mini: null,
        rowPlate: null,
      },
    }),
    specCardFixture({ specId: 'catalyst', accentToken: '--legend-catalyst-accent' }),
  ],
});
const WARRIOR = classCardFixture({
  classId: 'warrior',
  displayName: 'Legionnaire',
  accentToken: '--class-warrior-accent',
  art: { card: null, sigil: 'warrior-sigil', model: null, cardPlates: {}, rowPlate: null },
});
const HARBINGER = classCardFixture({
  classId: 'flying',
  displayName: 'Harbinger',
  status: 'locked',
});

const entry = (overrides: Partial<RosterEntry> & Pick<RosterEntry, 'legendId'>): RosterEntry => ({
  displayName: overrides.legendId,
  classId: 'warrior',
  specId: null,
  isBot: true,
  isPlayer: false,
  isRover: false,
  team: 'light',
  ...overrides,
});

const ALLIES: readonly RosterEntry[] = [
  entry({ legendId: 'player', classId: 'warrior', isBot: false, isPlayer: true, isRover: true }),
  entry({ legendId: 'bot-class', classId: 'warrior' }),
  entry({ legendId: 'bot-legend', classId: 'magus', specId: 'oracle' }),
  entry({ legendId: 'bot-no-portrait', classId: 'magus', specId: 'catalyst' }),
  entry({ legendId: 'bot-unknown', classId: 'flying', specId: 'harbinger-legend' }),
];

function storeWith(
  selection: { readonly classId: string; readonly specId: string | null } | null,
  legendClasses: readonly LegendClassCard[] = [WARRIOR, MAGUS],
) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({ ...contentSlice.getInitialState(), legendClasses }),
  );
  store.dispatch(matchSetupSlice.actions.setRosters({ allies: ALLIES, enemies: [] }));
  store.dispatch(matchSetupSlice.actions.select(selection));
  return store;
}

const tileOf = (selection: Parameters<typeof storeWith>[0], legendId: string) =>
  selectAllyTiles(storeWith(selection).getState()).find((tile) => tile.legendId === legendId);

describe('selectAllyTiles', () => {
  it('lists every ally in roster order', () => {
    expect(selectAllyTiles(storeWith(null).getState()).map((tile) => tile.legendId)).toEqual([
      'player',
      'bot-class',
      'bot-legend',
      'bot-no-portrait',
      'bot-unknown',
    ]);
  });

  it('shows the player undecided before a pick, whatever the roster says', () => {
    expect(tileOf(null, 'player')).toEqual({
      legendId: 'player',
      displayName: 'player',
      isPlayer: true,
      classId: null,
      classDisplayName: null,
      specId: null,
      state: 'undecided',
      imageAssetId: null,
      accentToken: null,
    });
  });

  it('shows the player the session selection: the class sigil, then the Legend portrait', () => {
    expect(tileOf({ classId: 'magus', specId: null }, 'player')).toMatchObject({
      classId: 'magus',
      classDisplayName: 'Magus',
      specId: null,
      state: 'class',
      imageAssetId: 'magus-sigil',
      accentToken: '--class-magus-accent',
    });
    expect(tileOf({ classId: 'magus', specId: 'oracle' }, 'player')).toMatchObject({
      specId: 'oracle',
      state: 'legend',
      imageAssetId: 'oracle-portrait',
      accentToken: '--legend-oracle-accent',
    });
  });

  it('shows a bot with a class only by its sigil and class accent', () => {
    expect(tileOf(null, 'bot-class')).toMatchObject({
      isPlayer: false,
      classId: 'warrior',
      classDisplayName: 'Legionnaire',
      state: 'class',
      imageAssetId: 'warrior-sigil',
      accentToken: '--class-warrior-accent',
    });
  });

  it('shows a bot with a Legend by its portrait and the Legend accent', () => {
    expect(tileOf(null, 'bot-legend')).toMatchObject({
      specId: 'oracle',
      state: 'legend',
      imageAssetId: 'oracle-portrait',
      accentToken: '--legend-oracle-accent',
    });
  });

  it('falls back to the class sigil for a Legend without a portrait', () => {
    expect(tileOf(null, 'bot-no-portrait')).toMatchObject({
      state: 'legend',
      imageAssetId: 'magus-sigil',
      accentToken: '--legend-catalyst-accent',
    });
  });

  it('has no class name, image, accent or Legend for a class the catalogue lacks', () => {
    expect(tileOf(null, 'bot-unknown')).toMatchObject({
      classId: 'flying',
      classDisplayName: null,
      specId: null,
      state: 'class',
      imageAssetId: null,
      accentToken: null,
    });
  });

  it('names each tile’s class by its catalogue display name: a flying bot is the Harbinger', () => {
    const tiles = selectAllyTiles(storeWith(null, [WARRIOR, MAGUS, HARBINGER]).getState());

    expect(tiles.map((tile) => [tile.legendId, tile.classDisplayName])).toEqual([
      ['player', null],
      ['bot-class', 'Legionnaire'],
      ['bot-legend', 'Magus'],
      ['bot-no-portrait', 'Magus'],
      ['bot-unknown', 'Harbinger'],
    ]);
  });

  it('returns the same array after a countdown tick, a new one after a pick', () => {
    const store = storeWith(null);
    const before = selectAllyTiles(store.getState());

    store.dispatch(matchSetupSlice.actions.setCountdown(41_000));
    expect(selectAllyTiles(store.getState())).toBe(before);

    store.dispatch(matchSetupSlice.actions.select({ classId: 'magus', specId: null }));
    expect(selectAllyTiles(store.getState())).not.toBe(before);
  });
});
