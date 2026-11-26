import type { Polygon, Vec2 } from '../utils/geometry.types';

/**
 * A big boss's body shape (DEC-381): the outline clicks, attack reach and hits count on instead of
 * the collider circle. It is static definition data in local world units for the art's
 * left-facing pose, so it is not hashed; navigation keeps the circle.
 */
export class CombatHitbox {
  /** @param outline - The local-space body outline (`UnitDefinition.combatHitbox`). */
  public constructor(private readonly outline: Polygon) {}

  /**
   * The outline in world units for a unit at `position`, mirrored when it faces right
   * (`facing.x > 0`), as the side-view art is.
   */
  public polygonAt(position: Vec2, facing: Vec2): Polygon {
    const mirror = facing.x > 0 ? -1 : 1;
    return this.outline.map(({ x, y }) => ({ x: position.x + x * mirror, y: position.y + y }));
  }
}
