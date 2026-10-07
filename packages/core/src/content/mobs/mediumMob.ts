import type { MobDefinition } from './mobs.types';

/**
 * Medium mob: hordes of 8; about the size of a Warrior.
 *
 * TUNE: health and movement are placeholders. The radius is the `10-physics.md` §1 recommendation.
 */
export const MEDIUM_MOB = {
  id: 'medium-mob',
  kind: 'medium-mob',
  displayName: 'Medium Mob',
  baseHealth: 250, // TUNE
  footprintRadius: 0.5, // TUNE: 10-physics §1
  movement: {
    maxSpeed: 0.13, // TUNE: 3.9 m/s at 30 ticks/s
    acceleration: 0.04, // TUNE
    mass: 1, // TUNE
  },
} as const satisfies MobDefinition;
