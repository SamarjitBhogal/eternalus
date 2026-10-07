import type { UnitDefinition } from '../units/units.types';

/** One content rule. Each rule checks one thing, so a new rule never edits an existing one. */
export interface UnitDefinitionRule {
  /** Returns one message per broken rule (without the definition id), or none when it holds. */
  check(definition: UnitDefinition): readonly string[];
}
