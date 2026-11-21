import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * Every role rating of a Legend is a fraction from 0 to 1 (`RoleRatings`), so the selection
 * screen's rating meters never run past their track; a spec with no ratings passes.
 */
export class RoleRatingRangeRule implements ContentRule<LegendSpecDefinition> {
  /** Flags each rating below 0, above 1 or not a number: `roleRatings.<role> must be …`. */
  public check(definition: LegendSpecDefinition): readonly string[] {
    return Object.entries(definition.roleRatings ?? {})
      .filter(([, value]) => !(value >= 0 && value <= 1))
      .map(([role]) => `roleRatings.${role} must be a fraction from 0 to 1`);
  }
}
