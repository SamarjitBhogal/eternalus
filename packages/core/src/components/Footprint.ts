import type { MapObject } from '../content/maps/mapObjects.types';
import type { Polygon, Rect } from '../utils/geometry.types';
import type { Outline } from './Outline.types';

/**
 * The exact ground a structure stands on, as world-space polygons: a lane tower's fort walls,
 * corner towers and keep, or a gate's outline (DEC-217 (17)), from the map object of the same id
 * (07 §1, the definition's `hasMapFootprint`), plus the solid polygons of the map objects that are
 * part of its body (the Stronghold's outer walls and throne, `MapObject.partOf`, DEC-373 (1); the
 * palace floor is not part of the Stronghold, DEC-344 (4)). `ofBody` builds it. Attack reach to
 * the structure is measured to these outlines instead of its collider circle, so a melee hit on
 * the fort is a hit on the tower (DEC-185) and melee at an outer wall reaches the Stronghold
 * (DEC-185 D); a chase closes on their nearest point, or holds inside them
 * (`ReachQuery.aimPointOf`). For a definition with `hasFortBox`, its `bounds` is the fort box that
 * tells a chase which units stand inside a fort (`PathingWorld.forts`; the Stronghold's box round
 * its outer walls and throne counts, DEC-217 (16); a gate's does not). A walk-on polygon
 * (`walkOn`: a gate's passage) is ground units stand on, so a shot flies over it unless it was
 * aimed at the structure (`ProjectileSystem`); a solid one (a fort, the Stronghold's outer walls)
 * is a body every shot can hit (`shotsCross` is empty).
 */
export class Footprint implements Outline {
  /** Every polygon: the ones of the map object of the same id, then the `solid` extras. */
  public readonly polygons: readonly Polygon[];

  /** The box around every polygon. */
  public readonly bounds: Rect;

  /** The polygons units walk on: the main polygons when they are a walk-on outline, else none. */
  public readonly walkOn: readonly Polygon[];

  /** The solid polygons: the main ones unless they are walked on, and every `solid` extra. */
  public readonly solid: readonly Polygon[];

  /**
   * None: every solid polygon of a structure's body stops a shot not aimed at the structure. A
   * `Footprint` does not read `MapObject.canShotsCross`; only a map object's own body does
   * (`MapObjectBody.shotsCross`, a camp fire, HC-Q105).
   */
  public readonly shotsCross: readonly Polygon[] = [];

  /**
   * @param polygons - The outline of the map object of the same id, each with at least 3 corners.
   * @param options - `isWalkOn`: those polygons are walked on, from a map object that does not
   *   block; solid when omitted. `solid`: the solid polygons of the structure's other body objects
   *   (DEC-373 (1)); none when omitted.
   * @throws Error when there is no polygon, or one has fewer than 3 corners.
   */
  public constructor(
    polygons: readonly Polygon[],
    {
      isWalkOn = false,
      solid = [],
    }: { readonly isWalkOn?: boolean; readonly solid?: readonly Polygon[] } = {},
  ) {
    this.polygons = [...polygons, ...solid];
    this.walkOn = isWalkOn ? polygons : [];
    this.solid = isWalkOn ? solid : this.polygons;
    if (polygons.length === 0 || this.polygons.some((polygon) => polygon.length < 3)) {
      throw new Error('A footprint needs at least one polygon, each with at least 3 corners.');
    }
    const points = this.polygons.flat();
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    this.bounds = { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  }

  /**
   * The footprint of a structure's body (07 §1), the one place that builds it: the polygons of its
   * map object of the same id (`own`, for a definition that `hasMapFootprint`), walked on when that
   * object does not block, then the solid polygons of the objects that are part of its body
   * (`parts`, `structureBodyParts`, DEC-373 (1)).
   *
   * @returns The footprint, or `undefined` when the structure has neither.
   */
  public static ofBody(
    own: MapObject | undefined,
    parts: readonly MapObject[],
  ): Footprint | undefined {
    const solid = parts.flatMap(({ footprints }) => footprints);
    if (own !== undefined) {
      return new Footprint(own.footprints, { isWalkOn: !own.isBlocking, solid });
    }
    return solid.length > 0 ? new Footprint(solid) : undefined;
  }
}
