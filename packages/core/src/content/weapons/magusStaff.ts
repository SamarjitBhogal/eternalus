import type { WeaponDefinition } from './weapons.types';

/**
 * Staff: ranged magical (reference 07, 05 §10), unique to the Magus and its default
 * weapon.
 *
 * TUNE: the numbers are the Magus's basic attack from `balancing.md` until the owner sets weapon
 * numbers (INBOX). Ranged implementation follows the authored 8 m reach; `grants: ['spell-potency']`
 * joins with its status.
 */
export const MAGUS_STAFF = {
  id: 'magus-staff',
  displayName: 'Staff',
  weaponClass: 'staff',
  attacks: [{ strategy: 'ranged', damage: 40, reach: 8, interval: 0.9 }], // TUNE: balancing.md Magus (40 / 0.9 s, magical, 8 m range: travelling staff bolts)
  allowedClasses: ['magus'],
  uniqueTo: 'magus',
} as const satisfies WeaponDefinition;
