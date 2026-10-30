import type { MobDefinition } from './mobs.types';

/**
 * The medium tower guard (architecture 18 §7): a medium minion that holds its structure instead of
 * marching. Stats are the medium minion's (balancing.md); guard counts, leash and respawn are the
 * structure's guard plan (`content/structures/guardPlans.ts`).
 */
export const MEDIUM_GUARD = {
  id: 'medium-guard',
  kind: 'medium-mob',
  displayName: 'Medium Guard',
  baseHealth: 400, // TUNE: balancing.md medium minion
  footprintRadius: 0.5, // TUNE: balancing.md medium minion
  visionRadius: 10, // TUNE:
  movementStrategy: 'leashed-chase',
  controller: 'guard',
  aiProfile: 'tower-guard',
  attack: { strategy: 'melee', damage: 28, reach: 1.5, interval: 1.2 }, // TUNE: balancing.md medium minion
  xpValue: 45, // TUNE: balancing.md "XP sources" (medium minion kill); guards have no row of their own
  movement: {
    maxSpeed: 3.2, // TUNE: m/s, balancing.md medium minion
    acceleration: 16, // TUNE: m/s², top speed after 0.2 s
    mass: 1.125, // TUNE: as the medium minion
  },
} as const satisfies MobDefinition;
