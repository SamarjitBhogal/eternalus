import type { MobDefinition } from './mobs.types';

/**
 * The medium forest-camp mob (architecture 18 §7.1): a medium minion's stats, held at its camp by
 * `GuardController`. Group size, leash and respawn are the camp's guard plan
 * (`content/structures/guardPlans.ts`).
 */
export const MEDIUM_CAMP_MOB = {
  id: 'medium-camp-mob',
  kind: 'medium-mob',
  displayName: 'Medium Camp Mob',
  baseHealth: 400, // TUNE: balancing.md medium minion
  footprintRadius: 0.5, // TUNE: balancing.md medium minion
  visionRadius: 10, // TUNE:
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'camp-mob',
  attack: { strategy: 'melee', damage: 28, reach: 1.5, interval: 1.2 }, // TUNE: balancing.md medium minion
  xpValue: 45, // TUNE: balancing.md "XP sources" (medium minion kill); camp mobs have no row of their own
  movement: {
    maxSpeed: 3.2, // TUNE: m/s, balancing.md medium minion
    acceleration: 16, // TUNE: m/s², top speed after 0.2 s
    mass: 1.125, // TUNE: as the medium minion
  },
} as const satisfies MobDefinition;
