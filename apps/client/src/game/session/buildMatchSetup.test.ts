import { describe, expect, it } from 'vitest';

import { classCardFixture } from '../../bridge/catalogueFixtures';
import { buildMatchSetup } from './buildMatchSetup';
import { LcgRng } from './LcgRng';
import type { Rng } from './Rng.types';

const card = (classId: string) => classCardFixture({ classId, displayName: classId.toUpperCase() });
const CLASSES = [card('warrior'), card('sentinel'), card('magus')];
const fixedRng = (value: number): Rng => ({ nextInt: () => value });

function build(rng: Rng = new LcgRng(1), legendClasses = CLASSES) {
  return buildMatchSetup({ seed: 1, rng, legendClasses, legendsPerTeam: 10, playerName: 'Ada' });
}

describe('buildMatchSetup', () => {
  it('builds ten allies and ten enemies', () => {
    const setup = build();
    expect(setup.allies).toHaveLength(10);
    expect(setup.enemies).toHaveLength(10);
  });

  it('makes the player their team’s Rover and the only non-bot', () => {
    const { allies, enemies } = build();
    const humans = [...allies, ...enemies].filter((entry) => !entry.isBot);
    expect(humans).toHaveLength(1);
    expect(humans[0]).toMatchObject({ isPlayer: true, isRover: true, displayName: 'Ada' });
    expect(allies[0]).toBe(humans[0]);
    expect(allies.filter((entry) => entry.isRover)).toHaveLength(1);
    expect(enemies.filter((entry) => entry.isRover)).toHaveLength(1);
    expect(enemies[0]).toMatchObject({ isBot: true, isRover: true });
  });

  it('puts allies on the player’s team and enemies on the other', () => {
    for (const [draw, team, other] of [
      [0, 'light', 'dark'],
      [1, 'dark', 'light'],
    ] as const) {
      const setup = build(fixedRng(draw));
      expect(setup.playerTeam).toBe(team);
      expect(setup.allies.every((entry) => entry.team === team)).toBe(true);
      expect(setup.enemies.every((entry) => entry.team === other)).toBe(true);
    }
  });

  it('gives bots the catalogue classes in order with unique ids and names', () => {
    const { allies, enemies } = build();
    expect(allies.slice(1, 4).map((entry) => entry.classId)).toEqual([
      'sentinel',
      'magus',
      'warrior',
    ]);
    expect(enemies[1]?.displayName).toBe('SENTINEL 2');
    const ids = [...allies, ...enemies].map((entry) => entry.legendId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('draws the same team from the same seed', () => {
    const teams = (seed: number) =>
      Array.from({ length: 20 }, (_, i) => build(new LcgRng(seed + i)).playerTeam);
    expect(teams(7)).toEqual(teams(7));
    expect(new Set(teams(7))).toEqual(new Set(['light', 'dark']));
  });

  it('refuses an empty catalogue', () => {
    expect(() => build(new LcgRng(1), [])).toThrow('no selectable Legend classes');
  });

  it('never gives a locked class to anyone and cycles the selectable classes in order', () => {
    const locked = classCardFixture({ classId: 'flying', status: 'locked' });
    const { allies, enemies } = build(new LcgRng(1), [locked, ...CLASSES]);
    const roster = [...allies, ...enemies];
    expect(roster.filter((entry) => entry.classId === 'flying')).toEqual([]);
    expect(allies.slice(0, 4).map((entry) => entry.classId)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'warrior',
    ]);
  });

  it('refuses a catalogue with only locked classes', () => {
    const locked = classCardFixture({ classId: 'flying', status: 'locked' });
    expect(() => build(new LcgRng(1), [locked])).toThrow('no selectable Legend classes');
  });
});
