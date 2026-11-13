import type { LevelCurveDefinition } from './progression.types';

/** XP for the first level-up. TUNE: DEC-190 (owner 2026-11-05); the soak metric recalibrates it. */
const FIRST_STEP = 110;
/** XP each further level-up adds. TUNE: same. */
const STEP_GROWTH = 2;

/**
 * The Legend XP curve: `xpToNext(L) = 110 + 2 · (L − 1)` for L = 1 … 49, 7,742 XP to the cap.
 *
 * DEC-190 (owner 2026-11-05) target: a Legend with 10 Legend kills and 100 minion kills, on a team
 * that has destroyed 4 towers, is about level 40 by minute 20, and no single kill or structure is
 * worth several levels. Modelled on League of Legends, where one kill is a fraction of a level.
 * Model result for that target: level 39 if the minion kills follow the horde mix (16 light,
 * 8 medium, 4 heavy), level 32 if most are light.
 *
 * Not final (owner 2026-11-05): the sprint 3.8 soak metric "Legend level at 10 and 20 minutes"
 * (balancing.md) recalibrates these numbers if levelling does not happen the way the owner wants.
 */
export const LEGEND_LEVEL_CURVE: LevelCurveDefinition = {
  id: 'legend',
  cap: 50, // owner decision O6 (PR #31 review)
  xpToNext: Array.from({ length: 49 }, (_, i) => FIRST_STEP + STEP_GROWTH * i),
};
