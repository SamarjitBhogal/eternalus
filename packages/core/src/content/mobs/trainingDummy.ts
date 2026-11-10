import type { MobDefinition } from './mobs.types';

/**
 * A slow light mob for tests, soaks and the developer menu. Never spawned in a real match.
 * Real mob definitions (light, medium and heavy) belong to the mob work in SCRUM-59.
 */
export const TRAINING_DUMMY = {
  id: 'training-dummy',
  kind: 'light-mob',
  displayName: 'Training Dummy',
  baseHealth: 100, // TUNE:
  footprintRadius: 0.4, // TUNE:
  visionRadius: 10, // TUNE:
  xpValue: 0, // owner decision O8 (PR #31 review): a test and dev unit pays nothing
  movementProfile: {
    maxSpeed: 3, // TUNE: m/s
    acceleration: 45, // TUNE: m/s²
    mass: 0.5, // TUNE:
  },
} as const satisfies MobDefinition;
