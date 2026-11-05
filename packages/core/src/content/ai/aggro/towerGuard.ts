import { GUARD_LEASH } from '../../structures/guardLeash';
import type { GuardAggroRuleDefinition } from '../ai.types';

/**
 * The tower guard's aggro rules (architecture 18 §7, 11 §4.4): the lane minion's priority list
 * without `lane-objective` and `turret-attacking-ally-minion` (no turret entity exists yet), and a
 * radius that stays inside the guard's leash, measured from its post. Its leash is its post's
 * guard plan.
 */
export const TOWER_GUARD_AGGRO = {
  id: 'tower-guard',
  controller: 'guard',
  // TUNE: the leash less the post gap, so a guard at an unmoved post acquires only what it may chase.
  acquisitionRadius: GUARD_LEASH.tower - GUARD_LEASH.postGap,
  priority: [
    'legend-attacking-ally-legend',
    'minion-attacking-ally-legend',
    'minion-attacking-ally-minion',
    'closest-minion',
    'closest-legend',
  ],
  leashGraceSeconds: 0, // owner DEC-144 E: a guard never chases past its circle
  aggroCooldownSeconds: 0, // owner DEC-144: no rest; a guard fights any enemy in its circle at once
  ghostFirstWaveTicks: 0, // guards never ghost
} as const satisfies GuardAggroRuleDefinition;
