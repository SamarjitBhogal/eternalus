import type { WeaponDefinition } from './weapons.types';

/**
 * Wuuthrad: a battle axe, melee physical with long reach (reference 07, 05 §10; MVP-if-time). The
 * Sentinel's default weapon, as no heavy weapon is MVP.
 *
 * TUNE: the numbers are the Sentinel's basic attack from `balancing.md` until the owner sets weapon
 * numbers (INBOX). The heavy attack and `damageMultipliers.sentinel` join with their systems.
 */
export const WUUTHRAD = {
  id: 'wuuthrad',
  displayName: 'Wuuthrad',
  weaponClass: 'battle-axe',
  attacks: [{ strategy: 'melee', damage: 90, reach: 1.8, interval: 1.2 }], // TUNE: balancing.md Sentinel (90 / 1.2 s); reach unspecified
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies WeaponDefinition;
