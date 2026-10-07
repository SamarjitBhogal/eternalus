import type { LegendDefinition } from './legends.types';

/**
 * Sentinel: heavy and powerful; one of the highest top speeds but very slow acceleration.
 *
 * TUNE: health and movement are placeholders. Acceleration follows the game doc's "up to 1
 * minute of running straight to get to full speed". The radius is DEC-06.
 */
export const SENTINEL = {
  id: 'sentinel',
  kind: 'sentinel',
  displayName: 'Sentinel',
  roleBlurb: 'Heavy and powerful; needs a long runway to reach a very high top speed.',
  baseHealth: 1200, // TUNE
  footprintRadius: 1.25, // DEC-06
  movement: {
    maxSpeed: 0.3, // TUNE: 9 m/s at 30 ticks/s
    acceleration: 0.0002, // TUNE: top speed after 1500 ticks (50 s)
    mass: 6, // TUNE
  },
} as const satisfies LegendDefinition;
