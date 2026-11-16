import type { Vec2 } from '../../utils/geometry.types';
import type { AreaShape, ShapePlacement } from './AreaShape.types';
import type { HitSpec } from './HitShape.types';

/**
 * The body a basic attack just struck, for a status's `onHit` steps (Fury's knock-back): the
 * on-hit placement runs from the attacker (`from`) to the struck body's centre (`to`), and a body
 * is in the shape when its centre is exactly `to`, so the step reaches the struck body and no
 * neighbour (two bodies on the very same point are both reached). A map object is never in it:
 * on-hit steps act on units, not on the walls and houses a basic attack can also strike. A push
 * moves away from the attacker.
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

  /** Never: on-hit steps do not reach map objects. */
  public overlapsPolygon(): boolean {
    return false;
  }

  /** The attacker, so a push moves the struck body away from it. */
  public centreFor(_shape: HitSpec, { from }: ShapePlacement): Vec2 {
    return { x: from.x, y: from.y };
  }
}
