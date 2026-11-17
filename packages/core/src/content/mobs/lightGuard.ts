import { LIGHT_MINION } from './lightMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The light tower guard (architecture 18 §7): a light minion that holds its structure instead of
 * marching. Stats are the light minion's, spread from it so a tuning change is one edit (DEC-168,
 * B5); guard counts, leash and respawn are the structure's guard plan
 * (`content/structures/guardPlans.ts`). No `xpValue` row of its own in balancing.md.
 */
export const LIGHT_GUARD = {
  ...LIGHT_MINION,
  id: 'light-guard',
  displayName: 'Light Guard',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'tower-guard',
} as const satisfies MobDefinition;
