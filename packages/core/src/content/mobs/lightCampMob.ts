import { LIGHT_MINION } from './lightMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The light forest-camp mob (architecture 18 §7.1): a light minion's stats, spread from it so a tuning
 * change is one edit (DEC-168, B5; DEC-167: camp mobs keep the lane-minion stats and XP), held at
 * its camp by `GuardController`. Group size, leash and respawn are the camp's guard plan
 * (`content/structures/guardPlans.ts`).
 */
export const LIGHT_CAMP_MOB = {
  ...LIGHT_MINION,
  id: 'light-camp-mob',
  displayName: 'Light Camp Mob',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'camp-mob',
} as const satisfies MobDefinition;
