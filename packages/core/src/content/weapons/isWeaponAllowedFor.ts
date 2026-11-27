import type { LegendClassId } from '../legends/legends.types';
import type { WeaponDefinition } from './weapons.types';

/**
 * Whether a Legend of the class `classId` may use `weapon` (reference 07 unique weapons, 05 §12
 * `WeaponAllowedRule`): the weapon's `allowedClasses` is `'any'` or lists the class, and its
 * `uniqueTo` is `null` or the class. The one place of the class-access rule: every content rule
 * that checks a weapon against a class calls it.
 *
 * @param weapon - The weapon's class limits, authored or loaded.
 * @param classId - The Legend class's content id.
 */
export const isWeaponAllowedFor = (
  weapon: Pick<WeaponDefinition, 'allowedClasses' | 'uniqueTo'>,
  classId: LegendClassId,
): boolean =>
  (weapon.allowedClasses === 'any' || weapon.allowedClasses.some((kind) => kind === classId)) &&
  (weapon.uniqueTo === null || weapon.uniqueTo === classId);
