import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { UnitDefinition } from '../units/units.types';
import type { ContentRule, UnitDefinitionRule } from './ContentValidator.types';
import { kitSubjectOf } from './kitSubjectOf';

/**
 * Every ability a kit equips is in the class's `abilityPool` (DEC-198: a loadout picks from the
 * pool). Checks a class's `defaultKit` and a spec's own `kit`; a spec with no kit has nothing to
 * check.
 */
export class KitInPoolRule implements UnitDefinitionRule, ContentRule<LegendSpecDefinition> {
  /** @param legends - The loaded Legend classes, for a spec's class pool. */
  public constructor(
    private readonly legends: Pick<ContentCatalogue<LegendDefinition>, 'has' | 'get'>,
  ) {}

  /** Flags each kit id outside the pool: `kit "<id>" is not in the abilityPool of class "<class>"`. */
  public check(definition: UnitDefinition | LegendSpecDefinition): readonly string[] {
    const subject = kitSubjectOf(definition, this.legends);
    const kit = subject?.kit;
    if (subject === null || !kit) {
      return [];
    }
    const { classId, pool, kitName } = subject;
    return [...kit.abilities, kit.ultimate]
      .filter((id) => !pool.includes(id))
      .map((id) => `${kitName} "${id}" is not in the abilityPool of class "${classId}"`);
  }
}
