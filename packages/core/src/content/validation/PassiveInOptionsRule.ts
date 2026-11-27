import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { UnitDefinition } from '../units/units.types';
import type { ContentRule, UnitDefinitionRule } from './ContentValidator.types';
import { kitSubjectOf } from './kitSubjectOf';

/**
 * A Legend's passive is one of its class's `passiveOptions` (DEC-330 P1; the content twin of 05
 * §12's loadout `PassiveOwnedRule`): a class's `defaultPassiveId` and a spec's own `passiveId`. A
 * definition with no passive has nothing to check.
 */
export class PassiveInOptionsRule implements UnitDefinitionRule, ContentRule<LegendSpecDefinition> {
  /** @param legends - The loaded Legend classes, for a spec's class options. */
  public constructor(
    private readonly legends: Pick<ContentCatalogue<LegendDefinition>, 'has' | 'get'>,
  ) {}

  /** Flags a passive outside the options (`passiveId "<id>" is not in the passiveOptions of …`). */
  public check(definition: UnitDefinition | LegendSpecDefinition): readonly string[] {
    const subject = kitSubjectOf(definition, this.legends);
    if (subject?.passiveId == null) {
      return [];
    }
    const { classId, passiveOptions, passiveId, passiveName } = subject;
    return passiveOptions.includes(passiveId)
      ? []
      : [`${passiveName} "${passiveId}" is not in the passiveOptions of class "${classId}"`];
  }
}
