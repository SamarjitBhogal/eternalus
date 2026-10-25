import type { FormationDefinition } from './formations.types';
import { RANKS_FORMATION } from './ranks';

/** Every horde formation by id (architecture 18 §5.1); a new shape is one entry here. */
export const FORMATIONS: Readonly<Record<string, FormationDefinition>> = {
  [RANKS_FORMATION.id]: RANKS_FORMATION,
};
