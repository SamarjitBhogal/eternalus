import { CAPTURE_POINT_COURT } from '../../zones/capturePointCourt';
import type { GuardAggroRuleDefinition } from '../ai.types';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * The capture point mini-boss's aggro rules (architecture 18 §7.1): the tower guard's (built on
 * `GUARD_LEASH`), with a radius wide enough that, from its post, the boss goes for an enemy
 * anywhere inside its court, as the corner boss does in its camp ring (PR #91). Away from its post
 * (at the court's edge after a fight) the far side can be out of range until it walks back. Its
 * leash is its zone's guard plan, which keeps it from chasing anyone outside the court.
 */
export const CAPTURE_POINT_BOSS_AGGRO = {
  ...TOWER_GUARD_AGGRO,
  id: 'capture-point-boss',
  // From its post it reaches the far side of the court (guardPlans.test.ts checks it).
  acquisitionRadius: CAPTURE_POINT_COURT.acquisitionRadius,
} as const satisfies GuardAggroRuleDefinition;
