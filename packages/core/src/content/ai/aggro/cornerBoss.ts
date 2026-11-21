import { CORNER_CAMP_RING } from '../../structures/cornerCampRing';
import type { AuthoredGuardAggroRule } from '../ai.types';
import { CAMP_MOB_AGGRO } from './campMob';

/**
 * The corner camp boss's aggro rules: the camp mob's, with a far wider radius, so the boss goes
 * for an enemy the moment it steps inside the camp's ring instead of only one at its feet. Its
 * leash is the corner camp's guard plan, which keeps it from chasing anyone outside the ring.
 */
export const CORNER_BOSS_AGGRO = {
  ...CAMP_MOB_AGGRO,
  id: 'corner-boss',
  // The ring's diameter (`CORNER_CAMP_RING`): from any post it reaches every point of the ring.
  acquisitionRadius: CORNER_CAMP_RING.acquisitionRadius,
} as const satisfies AuthoredGuardAggroRule;
