import type { Polygon, Vec2 } from '../../utils/geometry.types';
import type { AreaShape, ShapeBody, ShapePlacement } from './AreaShape.types';
import type { HitSpec } from './HitShape.types';

/**
 * The one body a basic attack or a shot just struck (the placement's `targetId`), for a status's
 * `onHit` steps (Fury's knock-back) and a shot's (Hamstring, DEC-269: a unit or a map object), and
 * no other body. A push moves away from `from`, the attacker or the shot's contact point.
 */
export class HitShape implements AreaShape<HitSpec> {
  public readonly kind = 'hit';

  /** A hit shape has no fields to check. */
  public validate(): readonly string[] {
    return [];
  }

  /** Whether the body is the struck one. */
  public overlaps(_shape: HitSpec, { targetId }: ShapePlacement, { id }: ShapeBody): boolean {
    return id === targetId;
  }

  /** Whether the map object is the struck one; its footprints do not matter. */
  public overlapsPolygon(
    _shape: HitSpec,
    { targetId }: ShapePlacement,
    _polygon: Polygon,
    { id }: Pick<ShapeBody, 'id'>,
  ): boolean {
    return id === targetId;
  }

  /** `from` (the attacker or the shot's contact point), so a push moves the struck body away. */
  public centreFor(_shape: HitSpec, { from }: ShapePlacement): Vec2 {
    return { x: from.x, y: from.y };
  }
}
