import { describe, expect, it } from 'vitest';

import { Progression } from './Progression';

const CURVE = { id: 'test', xpToNext: [100, 150, 200], cap: 4 };
const SCALING = { healthPerLevel: 0.1, aetherPerLevel: 10 };

describe('Progression', () => {
  it('starts at level 1 with no XP', () => {
    const progression = new Progression(CURVE, SCALING);

    expect(progression.level).toBe(1);
    expect(progression.xp).toBe(0);
  });

  it('levels along the curve and reports the levels gained', () => {
    const progression = new Progression(CURVE, SCALING);

    expect(progression.addXp(99)).toBe(0);
    expect(progression.addXp(1)).toBe(1); // 100 → level 2
    expect(progression.addXp(400)).toBe(2); // 500 ≥ 100 + 150 + 200 → level 4
    expect(progression.level).toBe(4);
  });

  it('never passes the cap, but keeps counting XP', () => {
    const progression = new Progression(CURVE, SCALING);

    expect(progression.addXp(10_000)).toBe(3);
    expect(progression.addXp(10_000)).toBe(0);
    expect(progression.level).toBe(4);
    expect(progression.xp).toBe(20_000);
  });

  it('rejects negative or non-finite XP', () => {
    const progression = new Progression(CURVE, SCALING);

    expect(() => progression.addXp(-1)).toThrow();
    expect(() => progression.addXp(Number.NaN)).toThrow();
  });
});
