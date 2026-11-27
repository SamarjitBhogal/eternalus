import type { Loadout } from '../Loadout.types';
import type { LoadoutContent, LoadoutProblem, LoadoutRule } from '../LoadoutValidator.types';

/** Every id of the loadout names content that exists (05 §12); the other rules skip unknown ids. */
export class ContentExistsRule implements LoadoutRule {
  public readonly id = 'content-exists';

  /**
   * Flags an unknown class, an unknown Legend and an unknown primary weapon. An unknown Legend is a
   * problem of the `class` field: the Legend says which class the loadout is for.
   */
  public check(loadout: Loadout, content: LoadoutContent): readonly LoadoutProblem[] {
    const problems: LoadoutProblem[] = [];
    if (!content.legends.has(loadout.classId)) {
      problems.push({
        field: 'class',
        ruleId: this.id,
        message: `class "${loadout.classId}" does not exist`,
      });
    }
    if (loadout.specId !== null && !content.specs.has(loadout.specId)) {
      problems.push({
        field: 'class',
        ruleId: this.id,
        message: `Legend "${loadout.specId}" does not exist`,
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
