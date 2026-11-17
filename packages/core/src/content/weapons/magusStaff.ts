import type { WeaponDefinition } from './weapons.types';

/**
 * Staff: melee physical, ranged magical (reference 07, 05 §10), unique to the Magus and its default
 * weapon.
 *
 * TUNE: the numbers are the Magus's basic attack from `balancing.md` until the owner sets weapon
 * numbers (INBOX). Melee only until ranged attacks land (SCRUM-169); `grants: ['spell-potency']`
 * joins with its status.
 */
export const MAGUS_STAFF = {
  id: 'magus-staff',
  displayName: 'Staff',
  weaponClass: 'staff',
  attacks: [{ strategy: 'melee', damage: 40, reach: 1.5, interval: 0.9 }], // TUNE: balancing.md Magus (40 / 0.9 s, magical, 8 m range: melee until ranged attacks land)
  allowedClasses: ['magus'],
  uniqueTo: 'magus',
} as const satisfies WeaponDefinition;
