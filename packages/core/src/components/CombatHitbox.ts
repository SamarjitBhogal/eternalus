import type { Polygon, Vec2 } from '../utils/geometry.types';

/** A unit's targetable outline, relative to its position and independent of navigation. */
export class CombatHitbox {
  /** Stores the authored local-space outline. */
  public constructor(private readonly outline: Polygon) {}

  /** Projects the outline into world coordinates, mirroring it with the sprite's facing. */
  public polygonAt(position: Vec2, facing: Vec2): Polygon {
    const mirror = facing.x > 0 ? -1 : 1;
    return this.outline.map(({ x, y }) => ({ x: position.x + x * mirror, y: position.y + y }));
  }
}
