import { describe, expect, it } from 'vitest';

import { abilityMatch } from '../__fixtures__/abilityMatch';

/**
 * Blade Runner (balancing.md:181, DEC-199): dash 8 m in 0.3 s (9 ticks), 120 damage and a 2 m
 * knock-back to every unit on the 1.5 m wide path, a 0.5 s (15 tick) stun within 1.5 m of the end.
 * The Warrior stands at (50, 50) and dashes east.
 */
const EAST = { x: 70, y: 50 };

const match = () =>
  abilityMatch([
    { kind: 'warrior', team: 'light', at: { x: 50, y: 50 } },
    { kind: 'warrior', team: 'dark', at: { x: 54, y: 50.5 } }, // on the path, north of the line
    { kind: 'warrior', team: 'dark', at: { x: 59.5, y: 50 } }, // past the end, in the stun circle
    { kind: 'warrior', team: 'dark', at: { x: 54, y: 53 } }, // beside the path
    { kind: 'warrior', team: 'light', at: { x: 55, y: 50 } }, // an ally on the path
  ]);

describe('Blade Runner (scenario)', () => {
  it('dashes the Warrior 8 m along the aim in 9 ticks', () => {
    const { ids, cast, run, at } = match();
    const [warrior] = ids;

    cast(warrior ?? '', 'ability-1', EAST);
    run(4);
    const midway = at(warrior).x;
    run(5);

    expect(midway).toBeGreaterThan(52);
    expect(midway).toBeLessThan(56);
    expect(at(warrior).x).toBeCloseTo(58, 5);
    expect(at(warrior).y).toBeCloseTo(50, 5);
    run(10);
    expect(at(warrior).x).toBeCloseTo(58, 5);
  });

  it('hits every enemy on the path once, for 120, and no ally or bystander', () => {
    const { ids, cast, run, lost } = match();
    const [warrior, onPath, pastEnd, beside, ally] = ids;

    cast(warrior ?? '', 'ability-1', EAST);
    run(30);

    expect([onPath, pastEnd, beside, ally].map(lost)).toEqual([120, 0, 0, 0]);
  });

  it('knocks the units on the path 2 m away from its line and staggers them', () => {
    const { ids, cast, run, at, log } = match();
    const [warrior, onPath] = ids;

    cast(warrior ?? '', 'ability-1', EAST);
    run(30);

    expect(at(onPath).x).toBeCloseTo(54, 5);
    expect(at(onPath).y).toBeCloseTo(52.5, 5);
    expect(log).toContain(`1 staggered on ${onPath ?? ''}`);
  });

  it('stuns the enemy at the end for 0.5 s: on in the cast tick, off 15 ticks later', () => {
    const { ids, cast, run, log } = match();
    const [warrior, onPath, pastEnd] = ids;

    cast(warrior ?? '', 'ability-1', EAST);
    run(30);

    const stun = log.filter((line) => line.includes('stun'));
    expect(stun).toEqual([`1 stun on ${pastEnd ?? ''}`, `16 stun off ${pastEnd ?? ''}`]);
    expect(log.some((line) => line.includes(`stun on ${onPath ?? ''}`))).toBe(false);
  });

  it('spends 35 aether, then refuses the slot until the 12 s cooldown is over', () => {
    const { ids, cast, run, entity, log } = match();
    const [warrior] = ids;
    const id = warrior ?? '';

    cast(id, 'ability-1', EAST);
    run(1);
    const afterCast = entity(warrior)?.aether?.current ?? 0;
    cast(id, 'ability-1', EAST);
    run(358);
    cast(id, 'ability-1', EAST); // tick 360: one tick short of 12 s
    run(1);
    cast(id, 'ability-1', EAST); // tick 361 = cast tick 1 + 360
    run(1);

    expect(afterCast).toBeCloseTo(100 - 35 + 4 / 30, 4); // DEC-201: 4/s at base, this tick's share
    expect(log.filter((line) => line.includes(' cast ') || line.includes('rejected'))).toEqual([
      `1 cast ${id} blade-runner`,
      `2 rejected ${id} on-cooldown`,
      `360 rejected ${id} on-cooldown`,
      `361 cast ${id} blade-runner`,
    ]);
  });
});
