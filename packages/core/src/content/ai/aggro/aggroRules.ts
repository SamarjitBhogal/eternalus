import type { AuthoredAggroProfile } from '../ai.types';
import { CAMP_MOB_AGGRO } from './campMob';
import { CAPTURE_POINT_BOSS_AGGRO } from './capturePointBoss';
import { CAPTURE_POINT_GUARD_AGGRO } from './capturePointGuard';
import { CORNER_BOSS_AGGRO } from './cornerBoss';
import { LANE_MINION_AGGRO } from './laneMinion';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * Every aggro profile by id (architecture 11 §2); a unit names one with `aiProfile`, and each
 * profile's `controller` is the only controller that accepts it.
 */
export const AGGRO_RULES: Readonly<Record<string, AuthoredAggroProfile>> = {
  [LANE_MINION_AGGRO.id]: LANE_MINION_AGGRO,
  [TOWER_GUARD_AGGRO.id]: TOWER_GUARD_AGGRO,
  [CAMP_MOB_AGGRO.id]: CAMP_MOB_AGGRO,
  [CORNER_BOSS_AGGRO.id]: CORNER_BOSS_AGGRO,
  [CAPTURE_POINT_BOSS_AGGRO.id]: CAPTURE_POINT_BOSS_AGGRO,
  [CAPTURE_POINT_GUARD_AGGRO.id]: CAPTURE_POINT_GUARD_AGGRO,
};
