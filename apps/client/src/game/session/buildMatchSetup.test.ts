import { type BotRosterDefinition, loadDisplayContent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { classCardFixture } from '../../bridge/__fixtures__/catalogueFixtures';
import { buildMatchSetup } from './buildMatchSetup';
import { LcgRng } from './LcgRng';
import type { Rng } from './Rng.types';

const card = (classId: string) => classCardFixture({ classId, displayName: classId.toUpperCase() });
const CLASSES = [card('warrior'), card('sentinel'), card('magus')];
const fixedRng = (value: number): Rng => ({ nextInt: () => value });
/** The shipped roster: three of each class, grouped (DEC-61, DEC-102). */
const SHIPPED_ROSTER = loadDisplayContent().botRoster;

function build(
  rng: Rng = new LcgRng(1),
  legendClasses = CLASSES,
  botRoster: BotRosterDefinition = SHIPPED_ROSTER,
) {
  return buildMatchSetup({
    seed: 1,
    rng,
    legendClasses,
    botRoster,
    legendsPerTeam: 10,
    playerName: 'Ada',
  });
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

  it('gives each team the roster’s lane bots in roster order, with unique ids and names', () => {
    const { allies, enemies } = build();
    for (const team of [allies, enemies]) {
      expect(team.slice(1).map((entry) => entry.classId)).toEqual(SHIPPED_ROSTER.laners);
    }
    expect(enemies[4]?.displayName).toBe('SENTINEL 5');
    const ids = [...allies, ...enemies].map((entry) => entry.legendId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('leaves every Legend and both Rovers’ classes for LOCK IN to fill (DEC-61)', () => {
    const { allies, enemies } = build();
    expect([...allies, ...enemies].every((entry) => entry.specId === null)).toBe(true);
    expect([allies[0]?.classId, enemies[0]?.classId]).toEqual(['warrior', 'warrior']);
    expect(enemies[0]?.displayName).toBe('WARRIOR 1');
  });

  it('refuses a roster whose lane bots and Rover do not make a team', () => {
    const short = { ...SHIPPED_ROSTER, laners: SHIPPED_ROSTER.laners.slice(1) };
    expect(() => build(new LcgRng(1), CLASSES, short)).toThrow(
      'the bot roster has 8 lane bots; a team of 10 needs 9 and its Rover',
    );
    expect(() => build(new LcgRng(1), CLASSES, { ...SHIPPED_ROSTER, laners: [] })).toThrow(
      'the bot roster has 0 lane bots',
    );
  });

  it('draws the same team from the same seed', () => {
    const teams = (seed: number) =>
      Array.from({ length: 20 }, (_, i) => build(new LcgRng(seed + i)).playerTeam);
    expect(teams(7)).toEqual(teams(7));
    expect(new Set(teams(7))).toEqual(new Set(['light', 'dark']));
  });

  it('refuses a roster class the catalogue lacks', () => {
    expect(() => build(new LcgRng(1), [])).toThrow(
      'the bot roster names "warrior", not a selectable class',
    );
  });

  it('never gives a bot a locked class (DEC-48)', () => {
    const locked = classCardFixture({ classId: 'magus', status: 'locked' });
    expect(() => build(new LcgRng(1), [card('warrior'), card('sentinel'), locked])).toThrow(
      'the bot roster names "magus", not a selectable class',
    );
  });
});
