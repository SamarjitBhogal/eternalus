import type { IdentifiedDefinition } from '../ContentCatalogue.types';
import type { ContentRule } from './ContentValidator.types';
import { KEBAB_CASE } from './KebabCaseIdRule.constants';

/**
 * Content ids are kebab-case, because replays, loadouts and saves reference them forever. Checks
 * any definition with an id (units, Legend specs).
 */
export class KebabCaseIdRule implements ContentRule<IdentifiedDefinition> {
  /** Flags an id that is not kebab-case. */
  public check(definition: IdentifiedDefinition): readonly string[] {
    return KEBAB_CASE.test(definition.id) ? [] : ['id must be kebab-case'];
  }
}
