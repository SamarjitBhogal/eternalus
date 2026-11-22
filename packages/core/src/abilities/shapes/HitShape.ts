import type { Polygon, Vec2 } from '../../utils/geometry.types';
import type { AreaShape, ShapePlacement } from './AreaShape.types';
import type { HitSpec } from './HitShape.types';

/**
 * The body a basic attack or a shot just struck, for a status's `onHit` steps (Fury's knock-back)
 * and a shot's (Hamstring): the on-hit placement runs from the attacker, or the shot's contact
 * point, (`from`) to the struck body's position (`to`), and a body is in the shape when its
 * position is exactly `to`, so the step reaches the struck body and no neighbour (two bodies on the
 * very same point are both reached). A map object (a house, a wall, a fort) is matched by its
 * position too, not by its footprints, so a shot that strikes it reaches it (DEC-269: 80 × 0.3).
 * Its position is the average of its footprint corners (`WorldObjectStore`), which for a fort lies
 * in its open court, so a test of the point against the footprints would miss it. A push moves
 * away from `from`.
 */
export class HitShape implements AreaShape<HitSpec> {
  public readonly kind = 'hit';

  /** A hit shape has no fields to check. */
  public validate(): readonly string[] {
    return [];
  }

  /** Whether the body's centre is the struck point. */
  public overlaps(_shape: HitSpec, { to }: ShapePlacement, point: Vec2): boolean {
    return point.x === to.x && point.y === to.y;
  }

  /** Whether the map object's position is the struck point; its footprints do not matter. */
  public overlapsPolygon(
    _shape: HitSpec,
    { to }: ShapePlacement,
    _polygon: Polygon,
    position: Vec2,
  ): boolean {
    return position.x === to.x && position.y === to.y;
  }

  /** `from` (the attacker or the shot's contact point), so a push moves the struck body away. */
  public centreFor(_shape: HitSpec, { from }: ShapePlacement): Vec2 {
    return { x: from.x, y: from.y };
  }
}
