import { describe, expect, it } from 'vitest';

import { CAPTURE_POINT_BOSS } from './capturePointBoss';
import { CORNER_BOSS } from './cornerBoss';
import { GREATER_BOSS } from './greaterBoss';
import { HEAVY_MINION } from './heavyMinion';
import { HEAVY_MOB_BASE, refHealth } from './bossReference';

describe('refHealth', () => {
  it("is balancing.md's 650 × 1.08^(L − 1)", () => {
    expect(refHealth(1)).toBe(650);
    expect(refHealth(4)).toBeCloseTo(650 * 1.08 ** 3, 9);
    expect(refHealth(7)).toBeCloseTo(650 * 1.08 ** 6, 9);
  });

  it('sizes the bosses from their balancing.md rows', () => {
    // MiniBoss at level 4: 10 × refHealth ≈ 8,200, 0.25 × refHealth ≈ 205 per hit.
    expect(CAPTURE_POINT_BOSS.baseHealth).toBe(Math.round(10 * refHealth(4)));
    expect(CAPTURE_POINT_BOSS.attack.damage).toBe(205);
    // The corner boss uses the same MiniBoss row, so the same health (DEC-415): 8,188.
    expect(CORNER_BOSS.baseHealth).toBe(Math.round(10 * refHealth(4)));
    expect(CORNER_BOSS.baseHealth).toBe(8188);
    // GreaterBoss at level 7: the 41,259 the owner keeps (DEC-371 E3), 0.45 × refHealth = 464.
    expect(GREATER_BOSS.baseHealth).toBe(41_259);
    expect(GREATER_BOSS.attack.damage).toBe(464);
  });
});

describe('HEAVY_MOB_BASE', () => {
  it("gives both bosses the heavy minion's movement and reach", () => {
    for (const boss of [CAPTURE_POINT_BOSS, GREATER_BOSS]) {
      expect(boss.movementProfile).toBe(HEAVY_MOB_BASE.movementProfile);
      expect(boss.attack.reach).toBe(HEAVY_MOB_BASE.reach);
    }
    expect(HEAVY_MOB_BASE.movementProfile).toBe(HEAVY_MINION.movementProfile);
    expect(HEAVY_MOB_BASE.reach).toBe(HEAVY_MINION.attack.reach);
  });
});
