import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * A Legend's aether (MP) pool must be a positive finite number. Units without an aether pool
 * (mobs, structures) are ignored, so this rule runs over every `UnitDefinition` at load.
 */
export class PositiveAetherRule implements UnitDefinitionRule {
  /** Flags a `baseAether` that is zero, negative, infinite or not a number; none when absent. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!('baseAether' in definition)) {
      return [];
    }

    const { baseAether } = definition as { baseAether: number };
    return Number.isFinite(baseAether) && baseAether > 0
      ? []
      : ['baseAether must be a positive finite number'];
  }
}
