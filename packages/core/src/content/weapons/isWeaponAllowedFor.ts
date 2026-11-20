import type { WeaponDefinition } from './weapons.types';

/**
 * Whether a Legend of class `classId` may carry `weapon` (reference 07: a non-unique weapon is
 * usable by any class, a unique one only by its class; architecture 05 §12 `WeaponAllowedRule`).
 * `uniqueTo` is always one of `allowedClasses` (`loadWeapons` checks it), so `allowedClasses`
 * decides.
 */
export const isWeaponAllowedFor = (
  weapon: Pick<WeaponDefinition, 'allowedClasses'>,
  classId: string,
): boolean =>
  weapon.allowedClasses === 'any' || weapon.allowedClasses.some((kind) => kind === classId);
