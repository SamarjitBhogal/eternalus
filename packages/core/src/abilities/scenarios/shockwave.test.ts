import { describe, expect, it } from 'vitest';

import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * Shockwave (balancing.md:190, DEC-209 (1)): a 5 m circle around the Magus, 120 magical damage
 * (x 1 against structures), a 2.5 m knock-back for a base-mass target and a 3 s (90 tick)
 * concussion, which raises the aether cost of the target's casts by 25% (more-abilities.md §7).
 * The Magus stands at (50, 50).
 */
const SELF = { x: 50, y: 50 };

const match = () =>
  abilityMatch([
    { kind: 'magus', team: 'light', at: SELF },
    { kind: 'warrior', team: 'dark', at: { x: 53, y: 50 } }, // base mass, east
    { kind: 'sentinel', team: 'dark', at: { x: 50, y: 46 } }, // mass 6, south
    { kind: 'magus', team: 'dark', at: { x: 47, y: 50 } }, // a Magus to concuss, west
    { kind: 'spawner-tower', team: 'dark', at: { x: 50, y: 56 } },
  ]);

describe('Shockwave (scenario)', () => {
  it('deals 120 to every enemy in reach, structures included (x 1)', () => {
    const { ids, cast, run, lost } = match();
    const [magus, warrior, sentinel, enemyMagus, tower] = ids;

    cast(magus ?? '', 'ability-1', SELF);
    run(2);

    expect([warrior, sentinel, enemyMagus, tower].map(lost)).toEqual([120, 120, 120, 120]);
  });

  it('knocks a base-mass enemy 2.5 m away and a heavy one a sixth of that', () => {
    const { ids, cast, run, at } = match();
    const [magus, warrior, sentinel] = ids;

    cast(magus ?? '', 'ability-1', SELF);
    run(30);

    expect(at(warrior).x).toBeCloseTo(55.5, 5);
    expect(at(sentinel).y).toBeCloseTo(46 - 2.5 / 6, 5);
  });

  it('concusses for 3 s, and the concussed Magus pays 25% more aether for its next cast', () => {
    const { ids, cast, run, entity, log } = match();
    const [magus, , , enemyMagus] = ids;
    const aether = () => entity(enemyMagus)?.aether?.current ?? 0;

    cast(magus ?? '', 'ability-1', SELF);
    run(10); // the 0.3 s stagger is over; the concussion is not
    const before = aether();
    cast(enemyMagus ?? '', 'ability-1', { x: 47, y: 50 });
    run(1);

    expect(before - aether()).toBeCloseTo(50 * 1.25 - 4 / 30, 4); // the price minus this tick's regen
    expect(
      log.filter((line) => line.includes(`concussion`) && line.endsWith(enemyMagus ?? '')),
    ).toEqual([`1 concussion on ${enemyMagus ?? ''}`]);
    run(80);
    expect(log).toContain(`91 concussion off ${enemyMagus ?? ''}`);
  });
});
