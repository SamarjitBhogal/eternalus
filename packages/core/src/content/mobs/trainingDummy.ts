import type { MobDefinition } from './mobs.types';

/** A slow light mob for tests, soaks and the developer menu. Never spawned in a real match. */
export const TRAINING_DUMMY = {
  id: 'training-dummy',
  kind: 'light-mob',
  displayName: 'Training Dummy',
  baseHealth: 100, // TUNE
  footprintRadius: 0.4, // TUNE
  movement: {
    maxSpeed: 0.1, // TUNE: 3 m/s at 30 ticks/s
    acceleration: 0.05, // TUNE
    mass: 0.5, // TUNE
  },
} as const satisfies MobDefinition;
