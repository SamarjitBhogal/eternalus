import type { MobDefinition } from './mobs.types';

/**
 * Heavy mob: hordes of 4; about the size of a Magus.
 *
 * TUNE: health and movement are placeholders. The radius is the `10-physics.md` §1 recommendation.
 */
export const HEAVY_MOB = {
  id: 'heavy-mob',
  kind: 'heavy-mob',
  displayName: 'Heavy Mob',
  baseHealth: 600, // TUNE
  footprintRadius: 0.8, // TUNE: 10-physics §1
  movement: {
    maxSpeed: 0.1, // TUNE: 3 m/s at 30 ticks/s
    acceleration: 0.02, // TUNE
    mass: 3, // TUNE
  },
} as const satisfies MobDefinition;
