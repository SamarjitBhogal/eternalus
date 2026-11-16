import { GUARD_LEASH } from '../../structures/guardLeash';
import type { GuardAggroRuleDefinition } from '../ai.types';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * The forest-camp mob's aggro rules (architecture 18 §7.1): the tower guard's, with a radius that
 * stays inside the camp's leash measured from the mob's post. Its leash is its camp's guard plan.
 */
export const CAMP_MOB_AGGRO = {
  ...TOWER_GUARD_AGGRO,
  id: 'camp-mob',
  // TUNE: the camp leash less the post gap.
  acquisitionRadius: GUARD_LEASH.camp - GUARD_LEASH.postGap,
} as const satisfies GuardAggroRuleDefinition;
