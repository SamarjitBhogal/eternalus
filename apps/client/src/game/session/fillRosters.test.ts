import { loadDisplayContent, SeededRandom } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { classCardFixture, specCardFixture } from '../../bridge/__fixtures__/catalogueFixtures';
import type { ClassSelection } from '../../bridge/events';
import { buildMatchSetup } from './buildMatchSetup';
import { fillRosters } from './fillRosters';
import { LcgRng } from './LcgRng';

/** Vanguard: one available and one locked Legend; Sentinel: none; Magus: two available. */
const CLASSES = [
  classCardFixture({
    classId: 'warrior',
    displayName: 'Vanguard',
    specs: [
      specCardFixture({ specId: 'knight' }),
      specCardFixture({ specId: 'sealed', status: 'locked' }),
    ],
  }),
  classCardFixture({ classId: 'sentinel', displayName: 'Sentinel', specs: [] }),
  classCardFixture({
    classId: 'magus',
    displayName: 'Magus',
    specs: [specCardFixture({ specId: 'oracle' }), specCardFixture({ specId: 'catalyst' })],
  }),
];

const DRAFT = buildMatchSetup({
  seed: 7,
  rng: new LcgRng(7),
  legendClasses: CLASSES,
  botRoster: loadDisplayContent().botRoster,
  legendsPerTeam: 10,
  playerName: 'Ada',
});
const PICK: ClassSelection = { classId: 'magus', specId: 'catalyst' };

function fill(
  rng: Pick<SeededRandom, 'nextInt'> = new SeededRandom(7).fork('roster'),
  selection: ClassSelection = PICK,
) {
  return fillRosters({
    draft: DRAFT,
    selection,
    legendClasses: CLASSES,
    enemyRover: 'mirror-player',
    rng,
  });
}

const bots = (rosters: ReturnType<typeof fill>) =>
  [...rosters.allies, ...rosters.enemies].filter((entry) => !entry.isRover);

describe('fillRosters', () => {
  it('gives the player the pick and the enemy Rover a copy of it (DEC-61)', () => {
    const { allies, enemies } = fill();
    expect(allies[0]).toEqual({ ...DRAFT.allies[0], classId: 'magus', specId: 'catalyst' });
    expect(enemies[0]).toEqual({
      ...DRAFT.enemies[0],
      classId: 'magus',
      specId: 'catalyst',
      displayName: 'Magus 1',
    });
  });

  it('gives every other bot a selectable Legend of its class, never a locked one', () => {
    const legends: Readonly<Record<string, readonly (string | null)[]>> = {
      warrior: ['knight'],
      sentinel: [null],
      magus: ['oracle', 'catalyst'],
    };
    // The seeded stream, and a draw of the last Legend every time (the locked one, unless skipped).
    for (const rng of [undefined, { nextInt: (_min: number, max: number) => max }]) {
      for (const entry of bots(fill(rng))) expect(legends[entry.classId]).toContain(entry.specId);
    }
  });

  it('keeps every bot’s class, id, name and team from the draft', () => {
    const filled = fill();
    const draftBots = [...DRAFT.allies, ...DRAFT.enemies].filter((entry) => !entry.isRover);
    expect(bots(filled)).toEqual(
      draftBots.map((entry, index) => ({ ...entry, specId: bots(filled)[index]?.specId })),
    );
  });

  it('lets two bots share a Legend: each draw is independent (DEC-102)', () => {
    const magi = bots(fill({ nextInt: (min) => min })).filter((e) => e.classId === 'magus');
    expect(magi).toHaveLength(6);
    expect(new Set(magi.map((entry) => entry.specId))).toEqual(new Set(['oracle']));
  });

  it('draws the same Legends from the same stream, and others from another', () => {
    const draws = (seed: number) => bots(fill(new SeededRandom(seed).fork('roster')));
    expect(draws(7)).toEqual(draws(7));
    const magusLegends = Array.from({ length: 8 }, (_, seed) =>
      draws(seed)
        .filter((entry) => entry.classId === 'magus')
        .map((entry) => entry.specId)
        .join(),
    );
    expect(new Set(magusLegends).size).toBeGreaterThan(1);
  });

  it('copies a pick without a Legend as it is', () => {
    const { enemies } = fill(undefined, { classId: 'sentinel', specId: null });
    expect(enemies[0]).toMatchObject({
      classId: 'sentinel',
      specId: null,
      displayName: 'Sentinel 1',
    });
  });

  it('refuses a pick whose class the catalogue lacks', () => {
    expect(() => fill(undefined, { classId: 'harbinger', specId: null })).toThrow(
      'no class "harbinger" in the catalogue',
    );
  });
});
