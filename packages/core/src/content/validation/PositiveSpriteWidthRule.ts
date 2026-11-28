import { LEGEND_KINDS } from '../legends/legendKinds';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * Every Legend's sprite width must be a positive finite number: the client draws the sprite, its
 * click area and the player's camera by it (DEC-424). Other units have none.
 */
export class PositiveSpriteWidthRule implements UnitDefinitionRule {
  /** Flags a Legend whose `spriteWidth` is missing, zero, negative, infinite or not a number. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!LEGEND_KINDS.has(definition)) {
      return [];
    }
    const width: unknown = definition.spriteWidth;
    return typeof width === 'number' && Number.isFinite(width) && width > 0
      ? []
      : ['spriteWidth must be a positive finite number'];
  }
}
