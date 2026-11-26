import type { FilledRosters } from '../bridge/events';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * The sprite sheets of every Legend in `rosters`, by sub-class id (DEC-378 (2): every Legend in
 * the match gets its sprite). The player's sheet comes first, then the other Legends' sheets in
 * roster order (allies, then enemies). Each sheet is in the map once, however many Legends share
 * it. A Legend without a sub-class, or whose sub-class has no sheet, adds nothing. `null` (no
 * rosters: before LOCK IN, or an online Duel) gives an empty map.
 */
export function matchLegendSheets(
  rosters: FilledRosters | null,
): ReadonlyMap<string, LegendSpriteSheet> {
  const entries = rosters === null ? [] : [...rosters.allies, ...rosters.enemies];
  const playerFirst = [
    ...entries.filter(({ isPlayer }) => isPlayer),
    ...entries.filter(({ isPlayer }) => !isPlayer),
  ];
  const sheets = new Map<string, LegendSpriteSheet>();
  // A key set again keeps its first place, so the player's sheet stays first.
  for (const { specId } of playerFirst) {
    const sheet = LEGEND_SPRITE_SHEETS[specId ?? ''];
    if (specId !== null && sheet !== undefined) sheets.set(specId, sheet);
  }
  return sheets;
}
