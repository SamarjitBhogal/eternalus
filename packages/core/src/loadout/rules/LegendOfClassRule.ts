import type { Loadout } from '../Loadout.types';
import type { LoadoutContent, LoadoutProblem, LoadoutRule } from '../LoadoutValidator.types';

/**
 * The loadout's Legend belongs to the loadout's class (05 §12; DEC-418 (2): core finds a Legend's
 * class). A loadout of no Legend (`specId: null`, the class default) passes. Skipped when the
 * class or the Legend is unknown (`ContentExistsRule` reports that).
 */
export class LegendOfClassRule implements LoadoutRule {
  public readonly id = 'legend-of-class';

  /** Flags a Legend whose class is not the loadout's class. */
  public check(loadout: Loadout, content: LoadoutContent): readonly LoadoutProblem[] {
    const { classId, specId } = loadout;
    if (specId === null || !content.specs.has(specId) || !content.legends.has(classId)) return [];
    const legendClassId = content.specs.get(specId).classId;
    return legendClassId === classId
      ? []
      : [
          {
            field: 'class',
            ruleId: this.id,
            message: `Legend "${specId}" is of class "${legendClassId}", not "${classId}"`,
          },
        ];
  }
}
