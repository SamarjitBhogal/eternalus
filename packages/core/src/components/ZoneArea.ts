import { distance, isPointInAnyPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/**
 * The ground a zone covers (architecture 07 §7, DEC-145 (a)): one or more polygons in world
 * units, such as a building's floor. A point is inside the area when it is inside any of them.
 */
export class ZoneArea {
  /**
   * @param polygons - The area's shapes in world units; kept as given, not copied.
   * @throws Error when there is no polygon, or one has fewer than 3 points or a point that is
   * not finite.
   */
  public constructor(public readonly polygons: readonly Polygon[]) {
    if (polygons.length === 0 || !polygons.every((polygon) => ZoneArea.isPolygon(polygon))) {
      throw new Error('A zone area needs polygons of at least 3 finite points.');
    }
  }

  /**
   * Whether `point` is inside the area. A point exactly on an edge may count or not, as
   * `isPointInPolygon` decides.
   */
  public contains(point: Vec2): boolean {
    return isPointInAnyPolygon(point, this.polygons);
  }

  /** How far the area reaches from `center`: a circle of this radius around it holds the area. */
  public reachFrom(center: Vec2): number {
    return Math.max(...this.polygons.flat().map((point) => distance(center, point)));
  }

  private static isPolygon(polygon: Polygon): boolean {
    return (
      polygon.length >= 3 && polygon.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
    );
  }
}
