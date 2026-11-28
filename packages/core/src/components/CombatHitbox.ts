import type { BodyShape } from '../content/units/units.types';
import { doesRayCrossPolygon, isPointInPolygon, isPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/**
 * A big boss's body shape (DEC-381): the outline clicks, attack reach and hits count on instead of
 * the collider circle, and the head inside it, which a head shot's line of flight crosses. Both
 * are static definition data in local world units for the art's left-facing pose, so they are not
 * hashed; navigation keeps the circle.
 */
export class CombatHitbox {
  /**
   * @param shape - The local-space body outline and the head inside it
   *   (`UnitDefinition.bodyShape`).
   * @throws Error when the outline or the head has fewer than 3 corners or a corner that is not
   *   finite.
   */
  public constructor(private readonly shape: BodyShape) {
    const parts = shape.head === undefined ? [shape.outline] : [shape.outline, shape.head];
    if (!parts.every(isPolygon)) {
      throw new Error(
        'CombatHitbox: the outline and the head each need at least 3 finite corners.',
      );
    }
  }

  /**
   * The outline in world units for a unit at `position`, mirrored when it faces right
   * (`facing.x > 0`), as the side-view art is.
   */
  public polygonAt(position: Vec2, facing: Vec2): Polygon {
    const mirror = CombatHitbox.mirrorOf(facing);
    return this.shape.outline.map(({ x, y }) => ({
      x: position.x + x * mirror,
      y: position.y + y,
    }));
  }

  /**
   * Whether a shot from `origin` that struck at `impactPoint` (world points) is a head shot on a
   * unit at `position` (DEC-381, HC-B60 A): the impact point is on the head, or the shot's line of
   * flight, carried on from the impact point through the body, crosses the head. Mirrored as
   * `polygonAt` mirrors the body; `false` without a head outline.
   */
  public isHeadShot(origin: Vec2, impactPoint: Vec2, position: Vec2, facing: Vec2): boolean {
    const { head } = this.shape;
    if (head === undefined) {
      return false;
    }
    const mirror = CombatHitbox.mirrorOf(facing);
    const local = { x: (impactPoint.x - position.x) * mirror, y: impactPoint.y - position.y };
    const flight = { x: (impactPoint.x - origin.x) * mirror, y: impactPoint.y - origin.y };
    return isPointInPolygon(local, head) || doesRayCrossPolygon(local, flight, head);
  }

  /**
   * Whether the world point `point` is in the zone behind a unit at `position`: at most the half
   * angle whose cosine is `cosHalfAngle` from the direction the side-view art shows its back (the
   * right when it faces left, the left when it faces right, as `polygonAt` mirrors it). 0 is the
   * whole rear half. A point straight above or below the unit is never behind.
   */
  public isBehind(point: Vec2, position: Vec2, facing: Vec2, cosHalfAngle: number): boolean {
    const dx = point.x - position.x;
    const dy = point.y - position.y;
    const along = dx * CombatHitbox.mirrorOf(facing);
    // along ≥ cos × distance, squared so there is no root (ADR 0012).
    return along > 0 && along * along >= cosHalfAngle * cosHalfAngle * (dx * dx + dy * dy);
  }

  /** -1 when the unit faces right, so the left-facing outline flips; else 1. */
  private static mirrorOf(facing: Vec2): number {
    return facing.x > 0 ? -1 : 1;
  }
}
