import type { Polygon, Rect } from '../utils/geometry.types';
import type { Outline } from './Outline.types';

/**
 * The exact ground a structure stands on, as world-space polygons: a lane tower's fort walls,
 * corner towers and keep, the Stronghold's palace outline, or a gate's outline (DEC-217 (17)),
 * from the map object of the same id (07 §1, the definition's `hasMapFootprint`). Attack reach to
 * the structure is measured to these outlines instead of its collider circle, so a melee hit on
 * the fort is a hit on the tower (DEC-185) and melee at the palace wall reaches the Stronghold
 * (DEC-185 D); a chase closes on their nearest point, or holds inside them
 * (`ReachQuery.aimPointOf`). For a definition with `hasFortBox`, its `bounds` is the fort box
 * that tells a chase which units stand inside a fort (`PathingWorld.forts`; the palace box
 * counts, DEC-217 (16); a gate's does not). A walk-on outline (`isWalkOn`: the palace floor, a
 * gate's passage) is ground units stand on, so a shot flies over it unless it was aimed at it
 * (`ProjectileSystem`); a solid one (a fort) is a body every shot can hit.
 */
export class Footprint implements Outline {
  /** The box around every polygon. */
  public readonly bounds: Rect;

  /** Whether units walk on the outline (its map object does not block): `false` for a solid one. */
  public readonly isWalkOn: boolean;

  /**
   * @param polygons - The outlines, each with at least 3 corners.
   * @param options - `isWalkOn`: the outline is walked on, from a map object that does not block;
   *   solid when omitted.
   * @throws Error when there is no polygon, or one has fewer than 3 corners.
   */
  public constructor(
    public readonly polygons: readonly Polygon[],
    { isWalkOn = false }: { readonly isWalkOn?: boolean } = {},
  ) {
    this.isWalkOn = isWalkOn;
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

  /** A shot not aimed at the structure flies over a walk-on outline, and stops on a solid one. */
  public get canShotsFlyOver(): boolean {
    return this.isWalkOn;
  }
}
