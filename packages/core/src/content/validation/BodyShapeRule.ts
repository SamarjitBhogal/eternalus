import { isPointInPolygon, isPolygon } from '../../utils/geometry';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * A unit's body shape (DEC-381), when it has one: the outline and the head each have at least 3
 * finite corners, and every corner of the head is inside the outline. Checked at load, so a bad
 * shape fails at boot and not when a boss spawns in a match.
 */
export class BodyShapeRule implements UnitDefinitionRule {
  /** Flags a bad outline, a bad head, or a head corner outside the outline. */
  public check({ bodyShape }: UnitDefinition): readonly string[] {
    if (bodyShape === undefined) {
      return [];
    }
    const { outline, head } = bodyShape;
    if (!isPolygon(outline)) {
      return ['bodyShape.outline needs at least 3 finite corners'];
    }
    if (head === undefined) {
      return [];
    }
    if (!isPolygon(head)) {
      return ['bodyShape.head needs at least 3 finite corners'];
    }
    return head.every((corner) => isPointInPolygon(corner, outline))
      ? []
      : ['bodyShape.head must be inside bodyShape.outline'];
  }
}
