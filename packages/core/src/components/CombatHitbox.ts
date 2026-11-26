import { isPointInPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/**
 * A big boss's body shape (DEC-381): the outline clicks, attack reach and hits count on instead of
 * the collider circle, and the head inside it that a projectile's head shot lands on. Both are
 * static definition data in local world units for the art's left-facing pose, so they are not
 * hashed; navigation keeps the circle.
 */
export class CombatHitbox {
  /**
   * @param outline - The local-space body outline (`UnitDefinition.combatHitbox`).
   * @param head - The local-space head outline inside it (`UnitDefinition.headHitbox`), if any.
   */
  public constructor(
    private readonly outline: Polygon,
    private readonly head?: Polygon,
  ) {}

  /**
   * The outline in world units for a unit at `position`, mirrored when it faces right
   * (`facing.x > 0`), as the side-view art is.
   */
  public polygonAt(position: Vec2, facing: Vec2): Polygon {
    const mirror = CombatHitbox.mirrorOf(facing);
    return this.outline.map(({ x, y }) => ({ x: position.x + x * mirror, y: position.y + y }));
  }

  /**
   * Whether the world point `point` is on the head of a unit at `position`, mirrored as
   * `polygonAt` mirrors the body; `false` without a head outline.
   */
  public isOnHead(point: Vec2, position: Vec2, facing: Vec2): boolean {
    if (this.head === undefined) {
      return false;
    }
    const mirror = CombatHitbox.mirrorOf(facing);
    return isPointInPolygon(
      { x: (point.x - position.x) * mirror, y: point.y - position.y },
      this.head,
    );
  }

  /** -1 when the unit faces right, so the left-facing outline flips; else 1. */
  private static mirrorOf(facing: Vec2): number {
    return facing.x > 0 ? -1 : 1;
  }
}
