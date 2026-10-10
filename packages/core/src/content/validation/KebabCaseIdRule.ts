import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';
import { KEBAB_CASE } from './KebabCaseIdRule.constants';

/** Content ids are kebab-case, because replays, loadouts and saves reference them forever. */
export class KebabCaseIdRule implements UnitDefinitionRule {
  /** Flags an id that is not kebab-case. */
  public check(definition: UnitDefinition): readonly string[] {
    return KEBAB_CASE.test(definition.id) ? [] : ['id must be kebab-case'];
  }
}
