import { HEAVY_MINION } from './heavyMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The heavy tower guard (architecture 18 §7): a heavy minion that holds its structure instead of
 * marching. Stats are the heavy minion's, spread from it so a tuning change is one edit (DEC-168,
 * B5); guard counts, leash and respawn are the structure's guard plan
 * (`content/structures/guardPlans.ts`). No `xpValue` row of its own in balancing.md.
 */
export const HEAVY_GUARD = {
  ...HEAVY_MINION,
  id: 'heavy-guard',
  displayName: 'Heavy Guard',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'tower-guard',
} as const satisfies MobDefinition;
