import type { MobDefinition } from './mobs.types';

/**
 * The light tower guard (architecture 18 §7): a light minion that holds its structure instead of
 * marching. Stats are the light minion's (balancing.md); guard counts, leash and respawn are the
 * structure's guard plan (`content/structures/guardPlans.ts`).
 */
export const LIGHT_GUARD = {
  id: 'light-guard',
  kind: 'light-mob',
  displayName: 'Light Guard',
  baseHealth: 150, // TUNE: balancing.md light minion
  footprintRadius: 0.4, // TUNE: balancing.md light minion
  visionRadius: 10, // TUNE:
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'tower-guard',
  attack: { strategy: 'melee', damage: 12, reach: 1.5, interval: 1.0 }, // TUNE: balancing.md light minion
  xpValue: 20, // TUNE: balancing.md "XP sources" (light minion kill); guards have no row of their own
  movement: {
    maxSpeed: 3.5, // TUNE: m/s, balancing.md light minion
    acceleration: 17.5, // TUNE: m/s², top speed after 0.2 s
    mass: 0.5, // TUNE: as the light minion
  },
} as const satisfies MobDefinition;
