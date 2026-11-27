import type { WeaponDefinition } from './weapons.types';

/**
 * Raptor Talons: a glove, melee physical (reference 07, 05 §10). The Warrior's default weapon.
 *
 * TUNE: the numbers are the Warrior's basic attack from `balancing.md` until the owner sets weapon
 * numbers (INBOX). `onHit: bleed` joins when weapon on-hit effects land.
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
    },
  ],
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies WeaponDefinition;
