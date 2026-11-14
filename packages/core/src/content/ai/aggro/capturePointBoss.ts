import { CAPTURE_POINT_COURT } from '../../zones/capturePointCourt';
import type { AggroRuleDefinition } from '../ai.types';

/**
 * The capture point mini-boss's aggro rules (architecture 18 §7.1): the tower guard's priority list,
 * with a radius wide enough that, from its post, the boss goes for an enemy anywhere inside its
 * court, as the corner boss does in its camp ring (PR #91). Away from its post (at the court's
 * edge after a fight) the far side can be out of range until it walks back. The guard plan's leash
 * still keeps it from chasing anyone outside the court.
 */
export const CAPTURE_POINT_BOSS_AGGRO = {
  id: 'capture-point-boss',
  // From its post it reaches the far side of the court (guardPlans.test.ts checks it).
  acquisitionRadius: CAPTURE_POINT_COURT.acquisitionRadius,
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
  ],
  leashRadius: CAPTURE_POINT_COURT.leashRadius, // the guard plan's is the one guards read
  leashGraceTicks: 0, // as the tower guard (DEC-144 E): never chases past its circle
  aggroCooldownTicks: 0, // as the tower guard (DEC-144): no rest
  ghostFirstWaveTicks: 0, // bosses never ghost
  callForHelpRadius: 0, // unused: guard-post mobs answer a fellow anywhere in their circle
} as const satisfies AggroRuleDefinition;
