import type { LegendDefinition } from './legends.types';

/**
 * Magus: magical; floats or walks; applies buffs or debuffs and can revive allies.
 *
 * TUNE: health and movement are placeholders (the game doc gives no Magus numbers). The radius
 * is DEC-06.
 */
export const MAGUS = {
  id: 'magus',
  kind: 'magus',
  displayName: 'Magus',
  roleBlurb: 'Magical; applies buffs or debuffs and can revive allies.',
  roleLabel: 'Ranged', // Figma 72:860
  tagline: 'Aether  ·  Ranged Support', // Figma 72:749: two spaces each side of U+00B7
  description:
    'With a mastery of Aether, the Magus bends reality into torrents of destructive energy. ' +
    'Channeling natural and arcane forces to decimate the enemy from afar and enhance nearby ' +
    'allies.', // Figma 72:748, verbatim
  // Figma 62:82 verbatim, with its hard line breaks (each line ends with a space; HC-Q5 picks the
  // canonical copy).
  alternateLayoutDescription:
    'The masters of Aether, Magus focus on the use of \n' +
    'abilities, while providing buffs for allies, and de-buffing \n' +
    'enemy units. Specializing in ranged attacks, Magus \n' +
    'aim to keep their distance from enemies to dish out \n' +
    'damage with high sustain. ',
  detailNames: {
    signature: 'Aetheric Recall', // Figma 72:773
    proficiency: 'Staff Proficiency', // Figma 72:767
    specialty: 'Arcane Intellect', // Figma 72:761
  },
  baseHealth: 800, // TUNE:
  baseAether: 140, // TUNE: balancing.md (level 1)
  weaponBias: 'staff',
  damageFocus: 'magic',
  pickUp: 'levitate',
  abilityPool: ['shockwave', 'sanctuary', 'imbue', 'death-ray'], // DEC-198: every ability and ultimate of the class
  defaultKit: {
    abilities: ['shockwave', 'sanctuary', 'imbue'], // DEC-209 (2): keys 1-3, similar effects share a key
    ultimate: 'death-ray', // DEC-209 (2): key 4
  },
  passiveOptions: ['studious', 'necromancy'],
  defaultAction: 'revive',
  referenceHeight: 3, // TUNE: ~10 ft (Hades)
  footprintRadius: 0.75, // DEC-06
  visionRadius: 25, // TUNE:
  movementProfile: {
    maxSpeed: 4.5, // TUNE: m/s
    acceleration: 22.5, // TUNE: m/s², top speed after 0.2 s (6 ticks)
    mass: 2, // TUNE:
  },
  defaultLoadout: { primaryWeaponId: 'magus-staff' }, // TUNE: default weapon (05 §10 table) until the owner picks one (INBOX)
  levelCurveId: 'legend',
  levelScaling: { healthPerLevel: 0.08, aetherPerLevel: 10 }, // TUNE: balancing.md
} as const satisfies LegendDefinition;
