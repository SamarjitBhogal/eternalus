import { createSelector } from '@reduxjs/toolkit';

import type { LegendClassId } from '../domain.types';
import { matchSetupSlice } from '../slices/matchSetupSlice';

/**
 * How many allied bots play each class ("2 Allies" on a class card, 72:865; F3): the roster's
 * class of every ally except the player, by class id (a class nobody plays is absent). Memoised
 * on the roster, so a countdown tick keeps the same object.
 */
export const selectAllyCountsByClass = createSelector(
  [matchSetupSlice.selectors.selectAllies],
  (allies): Readonly<Record<LegendClassId, number>> => {
    const counts: Record<LegendClassId, number> = {};
    for (const ally of allies) {
      if (!ally.isPlayer) counts[ally.classId] = (counts[ally.classId] ?? 0) + 1;
    }
    return counts;
  },
);
