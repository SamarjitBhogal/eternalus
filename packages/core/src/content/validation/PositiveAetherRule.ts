import { LEGEND_KINDS } from '../legends/legendKinds';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/** Every Legend's aether (MP) pool must be a positive finite number; other units have none. */
export class PositiveAetherRule implements UnitDefinitionRule {
  /** Flags a Legend whose `baseAether` is missing, zero, negative, infinite or not a number. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!LEGEND_KINDS.has(definition)) {
      return [];
    }
    const aether: unknown = definition.baseAether;
    return typeof aether === 'number' && Number.isFinite(aether) && aether > 0
      ? []
      : ['baseAether must be a positive finite number'];
  }
}
