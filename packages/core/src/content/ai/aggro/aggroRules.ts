import type { AggroProfileDefinition } from '../ai.types';
import { CAMP_MOB_AGGRO } from './campMob';
import { LANE_MINION_AGGRO } from './laneMinion';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * Every aggro profile by id (architecture 11 §2); a unit names one with `aiProfile`, and each
 * profile's `controller` is the only controller that accepts it.
 */
export const AGGRO_RULES: Readonly<Record<string, AggroProfileDefinition>> = {
  [LANE_MINION_AGGRO.id]: LANE_MINION_AGGRO,
  [TOWER_GUARD_AGGRO.id]: TOWER_GUARD_AGGRO,
  [CAMP_MOB_AGGRO.id]: CAMP_MOB_AGGRO,
};
