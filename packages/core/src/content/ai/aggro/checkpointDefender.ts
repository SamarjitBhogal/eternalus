import type { AuthoredGuardAggroRule } from '../ai.types';
import { TOWER_GUARD_AGGRO } from './towerGuard';

/**
 * The capture-point assist mob's aggro rules (architecture 18 §7.1; DEC-260): the tower guard's,
 * but it takes any enemy inside its leash, the zone's reach (DEC-257), so a Legend capturing at the
 * zone's edge is fought. Its leash is its post's.
 */
export const CHECKPOINT_DEFENDER_AGGRO = {
  ...TOWER_GUARD_AGGRO,
  id: 'checkpoint-defender',
  shouldAcquireAcrossLeash: true,
} as const satisfies AuthoredGuardAggroRule;
