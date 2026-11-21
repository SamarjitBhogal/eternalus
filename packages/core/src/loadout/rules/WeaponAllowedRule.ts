import { isWeaponAllowedFor } from '../../content/weapons/isWeaponAllowedFor';
import type { Loadout } from '../Loadout.types';
import type { LoadoutContent, LoadoutProblem, LoadoutRule } from '../LoadoutValidator.types';

/**
 * The class may carry the primary weapon (`allowedClasses`, `uniqueTo`; reference 07, 05 §12).
 * Skipped when the class or the weapon is unknown (`ContentExistsRule` reports that).
 */
export class WeaponAllowedRule implements LoadoutRule {
  public readonly id = 'weapon-allowed';

  /** Flags a primary weapon the class may not carry. */
  public check(loadout: Loadout, content: LoadoutContent): readonly LoadoutProblem[] {
    const { classId, primaryWeaponId } = loadout;
    if (!content.legends.has(classId) || !content.weapons.has(primaryWeaponId)) return [];
    return isWeaponAllowedFor(content.weapons.get(primaryWeaponId), classId)
      ? []
      : [
          {
            field: 'primary-weapon',
            ruleId: this.id,
            message: `class "${classId}" may not carry weapon "${primaryWeaponId}"`,
          },
        ];
  }
}
