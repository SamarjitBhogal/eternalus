import { describe, expect, it } from 'vitest';

import { ScoreBook } from './ScoreBook';
import type { LegendIdentity } from './ScoreBook.types';

const LIGHT_WARRIOR: LegendIdentity = {
  entityId: 'entity-1',
  team: 'light',
  classId: 'warrior',
  controller: 'human',
};
const LIGHT_MAGUS: LegendIdentity = {
  entityId: 'entity-2',
  team: 'light',
  classId: 'magus',
  controller: 'bot',
};
const DARK_SENTINEL: LegendIdentity = {
  entityId: 'entity-3',
  team: 'dark',
  classId: 'sentinel',
  controller: 'bot',
};
const ZERO_COUNTERS = {
  kills: 0,
  deaths: 0,
  assists: 0,
  minionKills: 0,
  neutralKills: 0,
  structureDamage: 0,
  score: 0,
} as const;

describe('ScoreBook', () => {
  it('starts with no rows, both teams at 0 and no recent hits', () => {
    expect(new ScoreBook().view).toEqual({
      legends: [],
      teams: {
        light: { score: 0, structuresDestroyed: 0 },
        dark: { score: 0, structuresDestroyed: 0 },
      },
      recentHits: [],
    });
  });

  it('adds a row with every counter at 0, in the order the rows are added', () => {
    const book = new ScoreBook();

    book.addRow(DARK_SENTINEL);
    book.addRow(LIGHT_WARRIOR);

    expect(book.view.legends).toEqual([
      { ...DARK_SENTINEL, ...ZERO_COUNTERS },
      { ...LIGHT_WARRIOR, ...ZERO_COUNTERS },
    ]);
    expect(book.rowOf(LIGHT_WARRIOR.entityId)).toEqual({ ...LIGHT_WARRIOR, ...ZERO_COUNTERS });
    expect(book.rowOf('entity-99')).toBeUndefined();
  });

  it('keeps one row per Legend: a second addRow for the id keeps the first row and its data', () => {
    const book = new ScoreBook();
    book.addRow(LIGHT_WARRIOR);
    book.award(LIGHT_WARRIOR.entityId, { counter: 'kills', by: 1, points: 15 });

    book.addRow({ ...LIGHT_WARRIOR, controller: 'bot' });

    expect(book.view.legends).toEqual([
      { ...LIGHT_WARRIOR, ...ZERO_COUNTERS, kills: 1, score: 15 },
    ]);
  });

  it("raises a Legend's counter by the award and adds its points to the row and the team", () => {
    const book = new ScoreBook();
    book.addRow(LIGHT_WARRIOR);
    book.addRow(DARK_SENTINEL);

    book.award(LIGHT_WARRIOR.entityId, { counter: 'structureDamage', by: 30, points: 0 });
    book.award(LIGHT_WARRIOR.entityId, { counter: 'minionKills', by: 1, points: 4 });

    expect(book.rowOf(LIGHT_WARRIOR.entityId)).toMatchObject({
      structureDamage: 30,
      minionKills: 1,
      score: 4,
    });
    expect(book.view.teams).toEqual({
      light: { score: 4, structuresDestroyed: 0 },
      dark: { score: 0, structuresDestroyed: 0 },
    });
  });

  it('refuses an award for an id with no row', () => {
    const book = new ScoreBook();

    expect(() => {
      book.award('entity-99', { counter: 'kills', by: 1, points: 15 });
    }).toThrow('No scoring row for "entity-99"');
    expect(book.view.teams.light.score).toBe(0);
  });

  it("adds team-only points and raises the team's counter without touching a row", () => {
    const book = new ScoreBook();
    book.addRow(DARK_SENTINEL);

    book.awardTeam('dark', { counter: 'structuresDestroyed', by: 1, points: 5 });

    expect(book.view.teams.dark).toEqual({ score: 5, structuresDestroyed: 1 });
    expect(book.view.teams.light).toEqual({ score: 0, structuresDestroyed: 0 });
    expect(book.rowOf(DARK_SENTINEL.entityId)).toEqual({ ...DARK_SENTINEL, ...ZERO_COUNTERS });
  });

  it("keeps each team's total equal to its Legends' points plus its team-only points", () => {
    const book = new ScoreBook();
    book.addRow(LIGHT_WARRIOR);
    book.addRow(LIGHT_MAGUS);

    book.award(LIGHT_WARRIOR.entityId, { counter: 'kills', by: 1, points: 15 });
    book.award(LIGHT_MAGUS.entityId, { counter: 'assists', by: 1, points: 7 });
    book.awardTeam('light', { counter: 'structuresDestroyed', by: 1, points: 5 });

    const legendPoints = book.view.legends.reduce((sum, row) => sum + row.score, 0);
    expect(legendPoints).toBe(22);
    expect(book.view.teams.light.score).toBe(legendPoints + 5);
  });

  it('keeps one recent hit per Legend and victim, at its latest tick (DEC-132)', () => {
    const book = new ScoreBook();

    book.recordHit('entity-3', 'entity-1', 4);
    book.recordHit('entity-3', 'entity-2', 5);
    book.recordHit('entity-3', 'entity-1', 9);

    expect(book.view.recentHits).toEqual([
      { victimId: 'entity-3', legendId: 'entity-1', tick: 9 },
      { victimId: 'entity-3', legendId: 'entity-2', tick: 5 },
    ]);
  });

  it("takes the victim's hitters inside the window, edge included, and forgets only its hits", () => {
    const book = new ScoreBook();
    book.recordHit('entity-3', 'entity-1', 0);
    book.recordHit('entity-3', 'entity-2', 10);
    book.recordHit('entity-4', 'entity-1', 10);
    book.recordHit('entity-3', 'entity-5', 1);

    const helpers = book.takeAssists('entity-3', 11, 10);

    expect(helpers).toEqual(['entity-2', 'entity-5']);
    expect(book.view.recentHits).toEqual([
      { victimId: 'entity-4', legendId: 'entity-1', tick: 10 },
    ]);
    expect(book.takeAssists('entity-3', 11, 10)).toEqual([]);
  });
});
