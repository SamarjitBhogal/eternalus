import { MEDIUM_MINION } from './mediumMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The medium capture-point assist mob (architecture 07 §7, 18 §7.1; DEC-260): a medium minion's
 * stats, spread from it so a tuning change is one edit (no reference gives assist mobs their own),
 * held at its capture point by `GuardController`. Which checkpoint spawns it is
 * `CHECKPOINT_DEFENDERS` (`content/structures/guardPlans.ts`).
 */
export const MEDIUM_ASSIST_MOB = {
  ...MEDIUM_MINION,
  id: 'medium-assist-mob',
  displayName: 'Medium Assist Mob',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'checkpoint-defender',
} as const satisfies MobDefinition;
