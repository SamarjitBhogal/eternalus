import { GUARD_LEASH } from '../../structures/guardLeash';
import type { AuthoredGuardAggroRule } from '../ai.types';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * The Greater Boss's aggro rules while it runs on `GuardController` (interim, 11 §4.6): the tower
 * guard's, with a radius that covers its whole zone from its post at the zone's centre.
 */
export const GREATER_BOSS_AGGRO = {
  ...TOWER_GUARD_AGGRO,
  id: 'greater-boss',
  acquisitionRadius: GUARD_LEASH.greaterBossZone, // TUNE: the centre zone's radius
} as const satisfies AuthoredGuardAggroRule;
