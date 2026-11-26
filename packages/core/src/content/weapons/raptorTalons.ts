import type { AuthoredWeaponDefinition } from './weapons.types';

/**
 * Raptor Talons: a glove, melee physical (reference 07, 05 §10). The Warrior's default weapon and the Zealot's start weapon.
 *
 * TUNE: the numbers are the Warrior's basic attack from `balancing.md` until the owner sets weapon
 * numbers (INBOX). Each hit adds one stack of `bleed` (Hamstring's bleed; DEC-374 (W5)).
 */
export const RAPTOR_TALONS = {
  id: 'raptor-talons',
  displayName: 'Raptor Talons',
  weaponClass: 'glove',
  attacks: [
    {
      strategy: 'melee-sweep',
      damage: 45, // TUNE: balancing.md Warrior (45 / 0.7 s)
      reach: 1, // TUNE: DEC-305, the weapon's part; the class adds its own (`LegendDefinition.meleeReach`)
      interval: 0.7, // TUNE: balancing.md Warrior (0.7 s)
      arcDegrees: 90, // TUNE: DEC-304
      // TUNE: DEC-374 (W5), tuneable after game testing: one bleed stack on each hit
      onHit: [{ kind: 'debuff', statusId: 'bleed', shape: { kind: 'hit' } }],
    },
  ],
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies AuthoredWeaponDefinition;
