import type { LegendDefinition } from './legends.types';

/**
 * Warrior (formerly Assault), displayed as Legionnaire (DEC-48): lighter, lower health, faster.
 * The content id stays `warrior` (17 R26).
 *
 * TUNE: health and movement are placeholders that only keep the class ordering from
 * `01-classes-and-subclasses.md` (Warrior fastest to top speed, lightest). The radius is DEC-06.
 */
export const WARRIOR = {
  id: 'warrior',
  kind: 'warrior',
  displayName: 'Legionnaire', // DEC-48
  roleBlurb: 'Lighter, lower health, faster.',
  roleLabel: 'Assault', // Figma 72:858: a role label, not the class name
  tagline: null,
  description: null,
  detailNames: { signature: null, proficiency: null, specialty: null },
  baseHealth: 600, // TUNE:
  weaponBias: 'light',
  damageFocus: 'mixed',
  pickUp: 'pick-up',
  passiveOptions: [],
  defaultAction: null,
  referenceHeight: 2.1, // TUNE: ~7 ft (Master Chief)
  footprintRadius: 0.5, // DEC-06
  visionRadius: 25, // TUNE:
  movement: {
    maxSpeed: 6, // TUNE: m/s
    acceleration: 45, // TUNE: m/s², top speed after about 0.13 s (4 ticks)
    mass: 1, // TUNE:
  },
} as const satisfies LegendDefinition;
