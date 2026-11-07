import { LEGEND_KINDS } from '../legends/legendKinds';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/** Every Legend's per-level scaling is finite and at least 0; a negative raise would throw mid-match. */
export class LevelScalingRule implements UnitDefinitionRule {
  /** Flags each scaling field that is negative or not finite. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!LEGEND_KINDS.has(definition)) {
      return [];
    }
    return Object.entries(definition.levelScaling)
      .filter(([, value]) => !(Number.isFinite(value) && value >= 0))
      .map(([field]) => `levelScaling.${field} must be a finite number of at least 0`);
  }
}
