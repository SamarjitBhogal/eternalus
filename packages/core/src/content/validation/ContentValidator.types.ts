import type { ContentCatalogue } from '../ContentCatalogue';
import type { IdentifiedDefinition } from '../ContentCatalogue.types';
import type { UnitDefinition } from '../units/units.types';

/**
 * One content rule over definitions of type `Definition`. Each rule checks one thing, so a new
 * rule never edits an existing one.
 */
export interface ContentRule<Definition extends IdentifiedDefinition> {
  /**
   * Returns one message per broken rule (without the definition id), or none when it holds.
   *
   * @param definition - The definition under check.
   * @param content - Every loaded definition, so a rule can check the ids a definition references.
   */
  check(definition: Definition, content: ContentCatalogue<Definition>): readonly string[];
}

/** The unit rules' contract, unchanged for every existing rule. */
export type UnitDefinitionRule = ContentRule<UnitDefinition>;
