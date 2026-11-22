import type { LegendDefinition } from './legends.types';

/**
 * Sentinel: heavy and powerful; one of the highest top speeds but very slow acceleration.
 *
 * TUNE: health and movement are placeholders. Movement is Wrecking Run (DEC-307): momentum, so a
 * turn slides and loses speed and a wall stops it; the build-up follows the game doc's "up to 1
 * minute of running straight to get to full speed", shortened for the MVP map (balancing.md,
 * "Sentinel wall sprint"). The radius is DEC-06.
 */
export const SENTINEL = {
  id: 'sentinel',
  kind: 'sentinel',
  displayName: 'Sentinel',
  roleBlurb: 'Heavy and powerful; needs a long runway to reach a very high top speed.',
  roleLabel: 'Tank', // Figma 72:859
  tagline: null,
  description: null,
  alternateLayoutDescription: null,
  detailNames: { signature: null, proficiency: null, specialty: null },
  baseHealth: 1200, // TUNE:
  baseAether: 80, // TUNE: balancing.md (level 1)
  weaponBias: 'heavy',
  damageFocus: 'physical',
  pickUp: 'grab',
  abilityPool: ['slam', 'rip-and-tear', 'shield-wall', 'berserk'], // DEC-198: every ability and ultimate of the class
  defaultKit: {
    abilities: ['slam', 'rip-and-tear', 'shield-wall'], // DEC-209 (2): keys 1-3, similar effects share a key
    ultimate: 'berserk', // DEC-209 (2): key 4
  },
  passiveOptions: ['wrecking-run'],
  defaultAction: null,
  referenceHeight: 4.6, // TUNE: ~15 ft (an elephant)
  footprintRadius: 1.25, // DEC-06
  visionRadius: 25, // TUNE:
  movementProfile: {
    maxSpeed: 9, // TUNE: m/s, balancing.md (sprint max)
    acceleration: 3, // TUNE: m/s² up to walkSpeed, balancing.md (normal acceleration)
    mass: 6, // TUNE:
    momentum: {
      walkSpeed: 3.5, // TUNE: m/s, balancing.md (base speed); owner card PR8 W1
      rampDuration: 20, // TUNE: s from walkSpeed to maxSpeed, balancing.md; owner card PR8 W1
      grip: 8, // TUNE: m/s², a reverse at 9 m/s slides about 5 m; owner card PR8 W2
    },
  },
  defaultLoadout: { primaryWeaponId: 'wuuthrad' }, // TUNE: default weapon (05 §10 table) until the owner picks one (INBOX)
  levelCurveId: 'legend',
  levelScaling: { healthPerLevel: 0.08, aetherPerLevel: 10 }, // TUNE: balancing.md
} as const satisfies LegendDefinition;
