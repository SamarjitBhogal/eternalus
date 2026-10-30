import type { MobDefinition } from './mobs.types';

/**
 * The heavy tower guard (architecture 18 §7): a heavy minion that holds its structure instead of
 * marching. Stats are the heavy minion's (balancing.md); guard counts, leash and respawn are the
 * structure's guard plan (`content/structures/guardPlans.ts`).
 */
export const HEAVY_GUARD = {
  id: 'heavy-guard',
  kind: 'heavy-mob',
  displayName: 'Heavy Guard',
  baseHealth: 1200, // TUNE: balancing.md heavy minion
  footprintRadius: 0.8, // TUNE: balancing.md heavy minion
  visionRadius: 10, // TUNE:
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'tower-guard',
  attack: { strategy: 'melee', damage: 70, reach: 1.5, interval: 1.6 }, // TUNE: balancing.md heavy minion
  xpValue: 120, // TUNE: balancing.md "XP sources" (heavy minion kill); guards have no row of their own
  movement: {
    maxSpeed: 2.8, // TUNE: m/s, balancing.md heavy minion
    acceleration: 14, // TUNE: m/s², top speed after 0.2 s
    mass: 3.125, // TUNE: as the heavy minion
  },
} as const satisfies MobDefinition;
