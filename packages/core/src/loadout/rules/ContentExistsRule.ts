import type { Loadout } from '../Loadout.types';
import type { LoadoutContent, LoadoutProblem, LoadoutRule } from '../LoadoutValidator.types';

/** Every id of the loadout names content that exists (05 §12); the other rules skip unknown ids. */
export class ContentExistsRule implements LoadoutRule {
  public readonly id = 'content-exists';

  /** Flags an unknown class and an unknown primary weapon. */
  public check(loadout: Loadout, content: LoadoutContent): readonly LoadoutProblem[] {
    const problems: LoadoutProblem[] = [];
    if (!content.legends.has(loadout.classId)) {
      problems.push({
        field: 'class',
        ruleId: this.id,
        message: `class "${loadout.classId}" does not exist`,
      });
    }
    if (!content.weapons.has(loadout.primaryWeaponId)) {
      problems.push({
        field: 'primary-weapon',
        ruleId: this.id,
        message: `weapon "${loadout.primaryWeaponId}" does not exist`,
      });
    }
    return problems;
  }
}
