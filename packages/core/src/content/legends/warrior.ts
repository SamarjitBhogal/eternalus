import type { LegendDefinition } from './legends.types';

/**
 * Warrior (formerly Assault): lighter, lower health, faster. Its title is `displayName` (DEC-58).
 * The content id stays `warrior` (17 R26).
 *
 * TUNE: health and movement are placeholders that only keep the class ordering from
 * `01-classes-and-subclasses.md` (Warrior fastest to top speed, lightest). The radius is DEC-06.
 */
export const WARRIOR = {
  id: 'warrior',
  kind: 'warrior',
  displayName: 'Vanguard', // DEC-58
  roleBlurb: 'Lighter, lower health, faster.',
  roleLabel: 'Assault', // Figma 72:858: a role label, not the class name
  tagline: null,
  description: null,
  alternateLayoutDescription: null,
  detailNames: { signature: null, proficiency: null, specialty: null },
  baseHealth: 600, // TUNE:
  baseAether: 100, // TUNE: balancing.md (level 1)
  weaponBias: 'light',
  damageFocus: 'mixed',
  pickUp: 'pick-up',
  abilityPool: ['blade-runner', 'veil', 'hamstring', 'fury'], // DEC-198: every ability and ultimate of the class
  defaultKit: {
    abilities: ['blade-runner', 'veil', 'hamstring'], // DEC-209 (2): keys 1-3, similar effects share a key
    ultimate: 'fury', // DEC-209 (2): key 4
  },
  passiveOptions: [],
  defaultAction: null,
  referenceHeight: 2.1, // TUNE: ~7 ft (Master Chief)
  footprintRadius: 0.5, // DEC-06
  visionRadius: 25, // TUNE:
  movementProfile: {
    maxSpeed: 6, // TUNE: m/s
    acceleration: 45, // TUNE: m/s², top speed after about 0.13 s (4 ticks)
    mass: 1, // TUNE:
  },
  defaultLoadout: { primaryWeaponId: 'raptor-talons' }, // TUNE: default weapon (05 §10 table) until the owner picks one (INBOX)
  levelCurveId: 'legend',
  levelScaling: { healthPerLevel: 0.08, aetherPerLevel: 10 }, // TUNE: balancing.md
} as const satisfies LegendDefinition;
