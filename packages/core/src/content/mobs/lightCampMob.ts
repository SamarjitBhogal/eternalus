import type { MobDefinition } from './mobs.types';

/**
 * The light forest-camp mob (architecture 18 §7.1): a light minion's stats, held at its camp by
 * `GuardController`. Group size, leash and respawn are the camp's guard plan
 * (`content/structures/guardPlans.ts`).
 */
export const LIGHT_CAMP_MOB = {
  id: 'light-camp-mob',
  kind: 'light-mob',
  displayName: 'Light Camp Mob',
  baseHealth: 150, // TUNE: balancing.md light minion
  footprintRadius: 0.4, // TUNE: balancing.md light minion
  visionRadius: 10, // TUNE:
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'camp-mob',
  attack: { strategy: 'melee', damage: 12, reach: 1.5, interval: 1.0 }, // TUNE: balancing.md light minion
  xpValue: 20, // TUNE: balancing.md "XP sources" (light minion kill); camp mobs have no row of their own
  movement: {
    maxSpeed: 3.5, // TUNE: m/s, balancing.md light minion
    acceleration: 17.5, // TUNE: m/s², top speed after 0.2 s
    mass: 0.5, // TUNE: as the light minion
  },
} as const satisfies MobDefinition;
