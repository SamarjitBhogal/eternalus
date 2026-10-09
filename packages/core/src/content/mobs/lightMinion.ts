import type { MobDefinition } from './mobs.types';

/**
 * Prototype light minion that escorts its team's Legend (controller `follow-leader`). Prototype
 * decision (2026-10-08) for the demo; the lane minions of Phase 3 replace it. No stats come from
 * the game docs yet: every number is a placeholder.
 */
export const LIGHT_MINION = {
  id: 'light-minion',
  kind: 'light-mob',
  displayName: 'Light Minion',
  baseHealth: 150, // TUNE:
  footprintRadius: 0.4, // TUNE:
  visionRadius: 10, // TUNE:
  controller: 'follow-leader',
  movement: {
    maxSpeed: 5.4, // TUNE: m/s, a little slower than the Warrior
    acceleration: 27, // TUNE: m/s², top speed after 0.2 s
    mass: 0.5, // TUNE:
  },
} as const satisfies MobDefinition;
