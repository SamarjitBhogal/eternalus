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
  baseHealth: 1200, // TUNE:
  weaponBias: 'heavy',
  damageFocus: 'physical',
  pickUp: 'grab',
  passiveOptions: ['wrecking-run'],
  defaultAction: null,
  referenceHeight: 4.6, // TUNE: ~15 ft (an elephant)
  footprintRadius: 1.25, // DEC-06
  visionRadius: 25, // TUNE:
  movement: {
    maxSpeed: 9, // TUNE: m/s
    acceleration: 0.18, // TUNE: m/s², top speed after 50 s
    mass: 6, // TUNE:
  },
} as const satisfies LegendDefinition;
