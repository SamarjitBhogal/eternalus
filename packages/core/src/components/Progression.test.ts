import { describe, expect, it } from 'vitest';

import { Progression } from './Progression';

const CURVE = { id: 'test', xpToNext: [100, 150, 200], cap: 4 };

describe('Progression', () => {
  it('starts at level 1 with no XP and keeps only its curve id (01 rule F)', () => {
    const progression = new Progression('test');

    expect(progression.curveId).toBe('test');
    expect(progression.level).toBe(1);
    expect(progression.xp).toBe(0);
  });

  it('levels along the curve and reports the levels gained', () => {
    const progression = new Progression('test');

    expect(progression.addXp(99, CURVE)).toBe(0);
    expect(progression.addXp(1, CURVE)).toBe(1); // 100 → level 2
    expect(progression.addXp(400, CURVE)).toBe(2); // 500 ≥ 100 + 150 + 200 → level 4
    expect(progression.level).toBe(4);
  });

  it('never passes the cap, but keeps counting XP', () => {
    const progression = new Progression('test');

    expect(progression.addXp(10_000, CURVE)).toBe(3);
    expect(progression.addXp(10_000, CURVE)).toBe(0);
    expect(progression.level).toBe(4);
    expect(progression.xp).toBe(20_000);
  });

  it('rejects negative or non-finite XP', () => {
    const progression = new Progression('test');

    expect(() => progression.addXp(-1, CURVE)).toThrow();
    expect(() => progression.addXp(Number.NaN, CURVE)).toThrow();
  });
});
