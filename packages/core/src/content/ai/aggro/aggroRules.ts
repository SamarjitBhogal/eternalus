import type { AggroRuleDefinition } from '../ai.types';
import { LANE_MINION_AGGRO } from './laneMinion';

/** Every aggro profile by id (architecture 11 §2); a unit names one with `aiProfile`. */
export const AGGRO_RULES: Readonly<Record<string, AggroRuleDefinition>> = {
  [LANE_MINION_AGGRO.id]: LANE_MINION_AGGRO,
};
