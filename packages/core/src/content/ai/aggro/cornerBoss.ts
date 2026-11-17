import { CORNER_CAMP_RING } from '../../structures/cornerCampRing';
import type { GuardAggroRuleDefinition } from '../ai.types';
import { CAMP_MOB_AGGRO } from './campMob';

/**
 * The corner camp boss's aggro rules: the camp mob's, with a far wider radius, so the boss goes
 * for an enemy the moment it steps inside the camp's ring instead of only one at its feet. Its
 * leash is the corner camp's guard plan, which keeps it from chasing anyone outside the ring.
 */
export const CORNER_BOSS_AGGRO = {
  ...CAMP_MOB_AGGRO,
  id: 'corner-boss',
  // From its post it reaches the far side of the ring (`CORNER_CAMP_RING`).
  acquisitionRadius: CORNER_CAMP_RING.acquisitionRadius,
} as const satisfies GuardAggroRuleDefinition;
