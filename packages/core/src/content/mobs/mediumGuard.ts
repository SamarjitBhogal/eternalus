import { MEDIUM_MINION } from './mediumMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The medium tower guard (architecture 18 §7): a medium minion that holds its structure instead of
 * marching. Stats are the medium minion's, spread from it so a tuning change is one edit (DEC-168,
 * B5); guard counts, leash and respawn are the structure's guard plan
 * (`content/structures/guardPlans.ts`). No `xpValue` row of its own in balancing.md.
 */
export const MEDIUM_GUARD = {
  ...MEDIUM_MINION,
  id: 'medium-guard',
  displayName: 'Medium Guard',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'tower-guard',
} as const satisfies MobDefinition;
