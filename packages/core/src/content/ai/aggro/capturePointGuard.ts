import { CAPTURE_POINT_COURT } from '../../zones/capturePointCourt';
import type { AuthoredGuardAggroRule } from '../ai.types';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * The capture point support mobs' aggro rules (architecture 18 §7.1): the tower guard's, with the
 * court's leash less its post gap (AI56-F4), so a support mob at an unmoved post acquires only what
 * it may chase. Its leash is its zone's guard plan.
 */
export const CAPTURE_POINT_GUARD_AGGRO = {
  ...TOWER_GUARD_AGGRO,
  id: 'capture-point-guard',
  acquisitionRadius: CAPTURE_POINT_COURT.leashRadius - CAPTURE_POINT_COURT.postGap,
} as const satisfies AuthoredGuardAggroRule;
