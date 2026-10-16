import { LEVEL_CURVES } from '../progression/levelCurves';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * A Legend's `levelCurveId` must name a curve in `LEVEL_CURVES`. Units that do not level (mobs,
 * structures) have no curve and are ignored.
 */
export class KnownLevelCurveRule implements UnitDefinitionRule {
  /** Flags an unknown curve id; none when the definition has no curve. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!('levelCurveId' in definition)) {
      return [];
    }

    // Safe: the `in` check above proved the field exists; its type is checked here.
    const id = (definition as { levelCurveId: unknown }).levelCurveId;
    return typeof id === 'string' && Object.hasOwn(LEVEL_CURVES, id)
      ? []
      : [`levelCurveId "${String(id)}" is not a known curve`];
  }
}
