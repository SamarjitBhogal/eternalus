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

  it('reports the XP inside the current level and what that level needs, and no next level at the cap (05 §15)', () => {
    const progression = new Progression('test');

    expect(progression.levelProgress(CURVE)).toEqual({ xp: 0, xpToNext: 100 });
    progression.addXp(130, CURVE); // level 2 starts at 100
    expect(progression.levelProgress(CURVE)).toEqual({ xp: 30, xpToNext: 150 });
    progression.addXp(10_000, CURVE); // level 4 (the cap) starts at 100 + 150 + 200 = 450
    expect(progression.levelProgress(CURVE)).toEqual({ xp: 10_130 - 450, xpToNext: null });
  });

  it('reports no next level at the cap, even when the curve lists more steps than its cap uses', () => {
    const progression = new Progression('test');
    const capped = { id: 'capped', xpToNext: [100, 150, 200], cap: 2 };

    progression.addXp(100, capped);
    expect(progression.level).toBe(2);
    expect(progression.levelProgress(capped)).toEqual({ xp: 0, xpToNext: null });
  });

  it('rejects negative or non-finite XP', () => {
    const progression = new Progression('test');

    expect(() => progression.addXp(-1, CURVE)).toThrow();
    expect(() => progression.addXp(Number.NaN, CURVE)).toThrow();
  });
});
