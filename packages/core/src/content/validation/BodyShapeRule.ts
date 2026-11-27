import { isPointInPolygon, isPolygon, nearestPointOnPolygons } from '../../utils/geometry';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * A unit's body shape (DEC-381), when it has one: the outline and the head each have at least 3
 * finite corners, the outline holds the whole footprint circle, and every corner of the head is
 * inside the outline. The unit hits from its outline (DEC-421) but walks on its circle, so a circle
 * past the outline would stop its chase short of its reach. Checked at load, so a bad shape fails
 * at boot and not when a boss spawns in a match.
 */
export class BodyShapeRule implements UnitDefinitionRule {
  /** Flags a bad outline, an outline smaller than the circle, a bad head, or a head outside. */
  public check({ bodyShape, footprintRadius }: UnitDefinition): readonly string[] {
    if (bodyShape === undefined) {
      return [];
    }
    const { outline, head } = bodyShape;
    if (!isPolygon(outline)) {
      return ['bodyShape.outline needs at least 3 finite corners'];
    }
    const centre = { x: 0, y: 0 };
    if (
      !isPointInPolygon(centre, outline) ||
      nearestPointOnPolygons(centre, [outline], { x: 0, y: 0 }) < footprintRadius
    ) {
      return ['bodyShape.outline must hold the whole footprint circle'];
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
