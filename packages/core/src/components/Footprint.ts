import type { Polygon, Rect } from '../utils/geometry.types';

/**
 * The exact ground a structure stands on, as world-space polygons: a lane tower's own object (the
 * keep) and its fort walls and corner towers (the map objects that are `partOf` it), or the
 * Stronghold's palace outline (07 §1, the definition's `hasMapFootprint`). A gate's bounds are
 * not a fort box (`hasFortBox`, DEC-217 (17)). Attack reach to the structure is measured to these
 * outlines instead of its collider circle, so a melee hit on the fort is a hit on the tower
 * (DEC-185) and melee at the palace wall reaches the Stronghold (DEC-185 D); a chase closes on
 * their nearest point, or holds inside them (`EntityStore.aimPointOf`). Its `bounds` is the fort
 * box that tells a chase which units stand inside a fort (`PathingWorld.forts`; the palace box
 * counts, DEC-217 (16)).
 */
export class Footprint {
  /** The box around every polygon. */
  public readonly bounds: Rect;

  /**
   * @param polygons - The outlines, each with at least 3 corners.
   * @throws Error when there is no polygon, or one has fewer than 3 corners.
   */
  public constructor(public readonly polygons: readonly Polygon[]) {
    if (polygons.length === 0 || polygons.some((polygon) => polygon.length < 3)) {
      throw new Error('A footprint needs at least one polygon, each with at least 3 corners.');
    }
    const points = polygons.flat();
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    this.bounds = { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  }
}
