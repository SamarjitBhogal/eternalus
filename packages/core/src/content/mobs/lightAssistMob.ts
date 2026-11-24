import { LIGHT_MINION } from './lightMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The light capture-point assist mob (architecture 07 §7, 18 §7.1; DEC-260): a light minion's
 * stats, spread from it so a tuning change is one edit (no reference gives assist mobs their own),
 * held at its capture point by `GuardController`. Which checkpoint spawns it is
 * `CHECKPOINT_DEFENDERS` (`content/structures/guardPlans.ts`).
 */
export const LIGHT_ASSIST_MOB = {
  ...LIGHT_MINION,
  id: 'light-assist-mob',
  displayName: 'Light Assist Mob',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'checkpoint-defender',
} as const satisfies MobDefinition;
