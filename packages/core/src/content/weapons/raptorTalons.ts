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
  attacks: [{ strategy: 'melee', damage: 45, reach: 1.5, interval: 0.7 }], // TUNE: balancing.md Warrior (45 / 0.7 s); reach unspecified
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies WeaponDefinition;
