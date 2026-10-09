import type { ContentCatalogue } from '../ContentCatalogue';
import type { UnitDefinition } from '../units/units.types';

/** One content rule. Each rule checks one thing, so a new rule never edits an existing one. */
export interface UnitDefinitionRule {
  /**
   * Returns one message per broken rule (without the definition id), or none when it holds.
   *
   * @param definition - The definition under check.
   * @param content - Every loaded definition, so a rule can check the ids a definition references.
   */
  check(definition: UnitDefinition, content: ContentCatalogue<UnitDefinition>): readonly string[];
}
