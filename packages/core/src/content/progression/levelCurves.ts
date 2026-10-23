import type { LevelCurveDefinition } from './progression.types';

/** XP for the first level-up. TUNE: derived from the income estimate in INBOX (O6). */
const FIRST_STEP = 4;
/** XP each further level-up adds; half the first step, as in balancing.md's curve. TUNE: same. */
const STEP_GROWTH = 2;

/**
 * The Legend XP curve: `xpToNext(L) = 4 + 2 · (L − 1)` for L = 1 … 49, 2,548 XP to the cap.
 * balancing.md's shape (growth = half the first step), sized so an active Legend earning about
 * 135 XP/min (balancing.md: these sources reach 2,700 XP in 18–22 minutes) reaches the cap around
 * minute 19 of a 30-minute match.
 */
export const LEGEND_LEVEL_CURVE: LevelCurveDefinition = {
  id: 'legend',
  cap: 50, // owner decision O6 (PR #31 review)
  xpToNext: Array.from({ length: 49 }, (_, i) => FIRST_STEP + STEP_GROWTH * i),
};
