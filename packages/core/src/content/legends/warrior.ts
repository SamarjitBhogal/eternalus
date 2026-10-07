import type { LegendDefinition } from './legends.types';

/**
 * Warrior (formerly Assault): lighter, lower health, faster.
 *
 * TUNE: health and movement are placeholders that only keep the class ordering from
 * `01-classes-and-subclasses.md` (Warrior fastest to top speed, lightest). The radius is DEC-06.
 */
export const WARRIOR = {
  id: 'warrior',
  kind: 'warrior',
  displayName: 'Warrior',
  roleBlurb: 'Lighter, lower health, faster.',
  baseHealth: 600, // TUNE
  footprintRadius: 0.5, // DEC-06
  movement: {
    maxSpeed: 0.2, // TUNE: 6 m/s at 30 ticks/s
    acceleration: 0.05, // TUNE: top speed after 4 ticks
    mass: 1, // TUNE
  },
} as const satisfies LegendDefinition;
