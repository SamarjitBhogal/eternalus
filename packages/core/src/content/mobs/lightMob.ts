import type { MobDefinition } from './mobs.types';

/**
 * Light mob: the swarm unit; hordes of 16.
 *
 * TUNE: health and movement are placeholders. The radius is the `10-physics.md` §1 recommendation.
 */
export const LIGHT_MOB = {
  id: 'light-mob',
  kind: 'light-mob',
  displayName: 'Light Mob',
  baseHealth: 100, // TUNE
  footprintRadius: 0.4, // TUNE: 10-physics §1
  movement: {
    maxSpeed: 0.15, // TUNE: 4.5 m/s at 30 ticks/s
    acceleration: 0.05, // TUNE
    mass: 0.5, // TUNE
  },
} as const satisfies MobDefinition;
