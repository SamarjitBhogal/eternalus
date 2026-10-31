import type { FormationDefinition } from './formations.types';

/** The default block of ranks every lane horde marches in (DEC-43, architecture 18 §5.1). */
export const RANKS_FORMATION = {
  id: 'ranks',
  shape: 'ranks',
  ranksWidth: 4, // TUNE:
  slotSpacing: 2, // TUNE: over the heavy minion's 1.6 m diameter
} as const satisfies FormationDefinition;
