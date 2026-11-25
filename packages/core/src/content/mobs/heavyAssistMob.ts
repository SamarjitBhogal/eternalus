import { HEAVY_MINION } from './heavyMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The heavy capture-point assist mob (architecture 07 §7, 18 §7.1; DEC-260): a heavy minion's
 * stats, spread from it so a tuning change is one edit (no reference gives assist mobs their own),
 * held at its capture point by `GuardController`. Which checkpoint spawns it is
 * `CHECKPOINT_DEFENDERS` (`content/structures/guardPlans.ts`).
 */
export const HEAVY_ASSIST_MOB = {
  ...HEAVY_MINION,
  id: 'heavy-assist-mob',
  displayName: 'Heavy Assist Mob',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'checkpoint-defender',
} as const satisfies MobDefinition;
