import { LEGEND_KINDS } from '../legends/legendKinds';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * Every Legend's per-level scaling is finite and at least 0; a negative raise would throw
 * mid-match. The structure rate is a middle ground, so it is never above the unit rate (DEC-405).
 */
export class LevelScalingRule implements UnitDefinitionRule {
  /** Flags each scaling field that is negative or not finite, and a structure rate too high. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!LEGEND_KINDS.has(definition)) {
      return [];
    }
    const scaling = definition.levelScaling;
    const issues = Object.entries(scaling)
      .filter(([, value]) => !(Number.isFinite(value) && value >= 0))
      .map(([field]) => `levelScaling.${field} must be a finite number of at least 0`);
    return scaling.basicAttackPerLevelOnStructures > scaling.basicAttackPerLevel
      ? [
          ...issues,
          'levelScaling.basicAttackPerLevelOnStructures must not exceed basicAttackPerLevel',
        ]
      : issues;
  }
}
