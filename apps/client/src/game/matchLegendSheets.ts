import type { FilledRosters } from '../bridge/events';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * The sprite sheets of every Legend in `rosters`, by sub-class id (DEC-378 (2): every Legend in
 * the match gets its sprite). Each sheet is in the map once, however many Legends share it. A
 * Legend without a sub-class, or whose sub-class has no sheet, adds nothing. `null` (no rosters:
 * before LOCK IN, or an online Duel) gives an empty map.
 */
export function matchLegendSheets(
  rosters: FilledRosters | null,
): ReadonlyMap<string, LegendSpriteSheet> {
  const entries = rosters === null ? [] : [...rosters.allies, ...rosters.enemies];
  const sheets = new Map<string, LegendSpriteSheet>();
  for (const { specId } of entries) {
    if (specId === null) continue;
    const sheet = LEGEND_SPRITE_SHEETS[specId];
    if (sheet !== undefined) sheets.set(specId, sheet);
  }
  return sheets;
}
