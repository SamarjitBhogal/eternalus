import { describe, expect, it } from 'vitest';

import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * Slam (balancing.md:185, :123): a 4 m circle around the Sentinel, 150 damage (x 2 against
 * structures and obstacles), a 3 m knock-back for a base-mass target and a 0.8 s (24 tick)
 * knock-up. The Sentinel stands at (50, 50); a self-centred cast needs no aim, so it aims at itself.
 */
const SELF = { x: 50, y: 50 };

const match = () =>
  abilityMatch([
    { kind: 'sentinel', team: 'light', at: SELF },
    { kind: 'warrior', team: 'dark', at: { x: 52, y: 50 } }, // base mass, east of the Sentinel
    { kind: 'sentinel', team: 'dark', at: { x: 50, y: 47 } }, // mass 6, south
    { kind: 'obstacle', definitionId: 'map-object-rock', team: 'neutral', at: { x: 47, y: 50 } },
    { kind: 'spawner-tower', team: 'dark', at: { x: 50, y: 55 } },
  ]);

describe('Slam (scenario)', () => {
  it('knocks a base-mass enemy 3 m away and a heavy one a sixth of that', () => {
    const { ids, cast, run, at } = match();
    const [sentinel, warrior, heavy] = ids;

    cast(sentinel ?? '', 'ability-1', SELF);
    run(30);

    expect(at(warrior).x).toBeCloseTo(55, 5);
    expect(at(warrior).y).toBeCloseTo(50, 5);
    expect(at(heavy).y).toBeCloseTo(47 - 3 / 6, 5);
  });

  it('deals 150 to units and twice that to a structure, and breaks a breakable obstacle', () => {
    const { ids, cast, run, lost, entity } = match();
    const [sentinel, warrior, heavy, rock, tower] = ids;
    expect(entity(rock)?.health).toEqual({ current: 100, max: 100 });
    expect(entity(tower)?.health?.max).toBe(3000);

    cast(sentinel ?? '', 'ability-1', SELF);
    run(2);

    expect([warrior, heavy, tower].map(lost)).toEqual([150, 150, 300]);
    expect(entity(rock)).toBeUndefined(); // 100 health, hit for 300: destroyed and removed
  });

  it('knocks the enemies up for 0.8 s, staggers them for 0.3 s, and control-immune follows the knock-up (DEC-99)', () => {
    const { ids, cast, run, log } = match();
    const [sentinel, warrior] = ids;

    cast(sentinel ?? '', 'ability-1', SELF);
    run(30);

    expect(log.filter((line) => line.endsWith(` ${warrior ?? ''}`))).toEqual([
      `1 staggered on ${warrior ?? ''}`,
      `1 knockup on ${warrior ?? ''}`,
      `10 staggered off ${warrior ?? ''}`,
      `25 knockup off ${warrior ?? ''}`,
      `25 control-immune on ${warrior ?? ''}`,
    ]);
  });

  it('adds up with a Shockwave that reaches the same enemy in the same tick (DEC-208)', () => {
    const { ids, cast, run, at } = abilityMatch([
      { kind: 'sentinel', team: 'light', at: SELF },
      { kind: 'magus', team: 'light', at: { x: 52, y: 47 } },
      { kind: 'warrior', team: 'dark', at: { x: 52, y: 50 } },
    ]);
    const [sentinel, magus, warrior] = ids;

    cast(sentinel ?? '', 'ability-1', SELF); // east: 3 m
    cast(magus ?? '', 'ability-1', { x: 52, y: 47 }); // south to north: 2.5 m
    run(30);

    expect(at(warrior).x).toBeCloseTo(52 + 3, 5);
    expect(at(warrior).y).toBeCloseTo(50 + 2.5, 5);
  });
});
