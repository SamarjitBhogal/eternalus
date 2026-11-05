import type { AggroRuleDefinition } from '../ai.types';
import { CAMP_MOB_AGGRO } from './campMob';
import { LANE_MINION_AGGRO } from './laneMinion';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/** Every aggro profile by id (architecture 11 §2); a unit names one with `aiProfile`. */
export const AGGRO_RULES: Readonly<Record<string, AggroRuleDefinition>> = {
  [LANE_MINION_AGGRO.id]: LANE_MINION_AGGRO,
  [TOWER_GUARD_AGGRO.id]: TOWER_GUARD_AGGRO,
  [CAMP_MOB_AGGRO.id]: CAMP_MOB_AGGRO,
};
