import { doesDiscReachPolygon } from '../../utils/circlePolygon';
import { cos } from '../../utils/deterministicMath';
import { RADIANS_PER_DEGREE, distance, isPointInPolygon } from '../../utils/geometry';
import type { Polygon, Vec2 } from '../../utils/geometry.types';
import { doesSectorReachDisc, doesSectorReachPolygon } from '../../utils/sector';
import { mustBePositive } from '../specChecks';
import type { AreaShape, ShapeBody, ShapePlacement } from './AreaShape.types';
import type { ConeSpec } from './ConeShape.types';
import { FULL_TURN_DEGREES, NO_DIRECTION } from './ConeShape.constants';

/**
 * A fan in front of the caster (Rip & Tear, DEC-206): a circular sector with its tip on the
 * placement's `to` (the caster, for a cast's own step), pointing along the cast's aim (the
 * placement's `direction`), reaching `reach` metres past the caster's body edge (the placement's
 * `casterRadius`: reach counts from the body edge, as a melee sweep's does, DEC-319) and spanning
 * `arcDegrees`. The geometry is a melee sweep's (`utils/sector.ts`). A fan of a full turn (360) is
 * the whole circle of that reach around the caster: DEC-206 (2)'s circle "with the fan's range as
 * its radius", which needs no direction. A body is in it when its circle overlaps it; a body with an
 * outline when the tip stands inside the outline or the fan reaches the outline. A fan with no
 * direction (a cast aimed at the caster itself) holds only what covers its tip.
 */
export class ConeShape implements AreaShape<ConeSpec> {
  public readonly kind = 'cone';

  /** A fan needs a positive, finite reach and an arc above 0 and at most 180, or a full turn. */
  public validate({ reach, arcDegrees }: ConeSpec): readonly string[] {
    return [
      ...mustBePositive(reach, 'cone reach'),
      ...((arcDegrees > 0 && arcDegrees <= FULL_TURN_DEGREES / 2) ||
      arcDegrees === FULL_TURN_DEGREES
        ? []
        : ['cone arcDegrees must be above 0 and at most 180, or 360 (the full circle)']),
    ];
  }

  /** Whether the body's circle overlaps the fan. */
  public overlaps(shape: ConeSpec, placement: ShapePlacement, body: ShapeBody): boolean {
    const radius = ConeShape.radiusOf(shape, placement);
    if (shape.arcDegrees === FULL_TURN_DEGREES) {
      return distance(placement.to, body.position) <= radius + body.radius;
    }
    return doesSectorReachDisc(
      placement.to,
      placement.direction ?? NO_DIRECTION,
      radius,
      ConeShape.cosHalfArcOf(shape),
      body.position,
      body.radius,
    );
  }

  /** Whether the tip stands inside the footprint or the fan reaches its outline. */
  public overlapsPolygon(shape: ConeSpec, placement: ShapePlacement, polygon: Polygon): boolean {
    const { to } = placement;
    const radius = ConeShape.radiusOf(shape, placement);
    if (shape.arcDegrees === FULL_TURN_DEGREES) {
      return isPointInPolygon(to, polygon) || doesDiscReachPolygon(to, radius, polygon);
    }
    return (
      isPointInPolygon(to, polygon) ||
      doesSectorReachPolygon(
        to,
        placement.direction ?? NO_DIRECTION,
        radius,
        ConeShape.cosHalfArcOf(shape),
        polygon,
      )
    );
  }

  /** The tip (the caster), so a push moves a body straight away from the caster. */
  public centreFor(_shape: ConeSpec, { to }: ShapePlacement): Vec2 {
    return { x: to.x, y: to.y };
  }

  /** The fan's radius from its tip: the caster's body radius plus the authored reach (DEC-319). */
  private static radiusOf({ reach }: ConeSpec, { casterRadius = 0 }: ShapePlacement): number {
    return casterRadius + reach;
  }

  /** The cosine of half the arc (a fan of at most 180 degrees). */
  private static cosHalfArcOf({ arcDegrees }: ConeSpec): number {
    return cos((arcDegrees / 2) * RADIANS_PER_DEGREE);
  }
}
