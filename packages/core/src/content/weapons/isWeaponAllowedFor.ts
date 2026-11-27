import type { WeaponDefinition } from './weapons.types';

/**
 * Whether `classId` may carry `weapon` (reference 07: a non-unique weapon is usable by any class, a
 * unique one only by its class): the class is in `allowedClasses`, and `uniqueTo`, when set, is
 * that class.
 */
export const isWeaponAllowedFor = (
  weapon: Pick<WeaponDefinition, 'allowedClasses' | 'uniqueTo'>,
  classId: string,
): boolean =>
  (weapon.allowedClasses === 'any' || weapon.allowedClasses.some((kind) => kind === classId)) &&
  (weapon.uniqueTo === null || weapon.uniqueTo === classId);
