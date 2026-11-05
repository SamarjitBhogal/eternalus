import { MEDIUM_MINION } from './mediumMinion';
import type { MobDefinition } from './mobs.types';

/**
 * The medium forest-camp mob (architecture 18 §7.1): a medium minion's stats, spread from it so a
 * tuning change is one edit (DEC-168, B5; DEC-167: camp mobs keep the lane-minion stats and XP),
 * held at its camp by `GuardController`. Group size, leash and respawn are the camp's guard plan
 * (`content/structures/guardPlans.ts`).
 */
export const MEDIUM_CAMP_MOB = {
  ...MEDIUM_MINION,
  id: 'medium-camp-mob',
  displayName: 'Medium Camp Mob',
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'camp-mob',
} as const satisfies MobDefinition;
