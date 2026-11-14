import { describe, expect, it } from 'vitest';
import { TowerSanctumBuilder } from './TowerSanctumBuilder';
import { CAMP_CRYSTALS } from '../content/maps/campScenery';

describe('TowerSanctumBuilder', () => {
  it('keeps faction sanctums cosmetic and gives every piece to its destructible fort', () => {
    for (const isDark of [false, true]) {
      const art = new TowerSanctumBuilder().build('tower', isDark);
      expect(art.length).toBeGreaterThan(40);
      expect(
        art.every(
          (piece) =>
            piece.object?.id === 'tower' &&
            piece.object.kind === 'fort' &&
            !piece.object.isFootprint,
        ),
      ).toBe(true);
      expect(new Set(art.map((piece) => piece.id)).size).toBe(art.length);
      expect(art.some((piece) => piece.id.includes('sanctum-stair'))).toBe(true);
      expect(
        art.some((piece) => piece.color === CAMP_CRYSTALS[isDark ? 'dark' : 'light'].crystal),
      ).toBe(true);
      expect(new TowerSanctumBuilder().build('tower', isDark)).toEqual(art);
    }
  });
});
