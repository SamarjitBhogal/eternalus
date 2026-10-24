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
  baseHealth: 600, // TUNE:
  baseAether: 100, // TUNE: balancing.md (level 1)
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
  // Basic attack until weapons (05 §10) land.
  attack: { strategy: 'melee', damage: 45, reach: 1.5, interval: 0.7 }, // TUNE: balancing.md (45 / 0.7 s); reach unspecified
  levelCurveId: 'legend',
  levelScaling: { healthPerLevel: 0.08, aetherPerLevel: 10 }, // TUNE: balancing.md
} as const satisfies LegendDefinition;
