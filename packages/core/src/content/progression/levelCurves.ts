import type { LevelCurveDefinition } from './progression.types';

/**
 * Every level curve by id. TUNE: balancing.md "XP curve and level cap":
 * `xpToNext(L) = 100 + 50 · (L − 1)` for L = 1 … 9, cap 10 (2,700 XP to level 10).
 */
export const LEVEL_CURVES: Readonly<Record<string, LevelCurveDefinition>> = {
  legend: {
    id: 'legend',
    xpToNext: [100, 150, 200, 250, 300, 350, 400, 450, 500],
    cap: 10,
  },
};
