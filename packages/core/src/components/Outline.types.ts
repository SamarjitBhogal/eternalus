import type { Polygon, Rect } from '../utils/geometry.types';

/**
 * An entity's exact outline, used instead of its collider circle: attack reach and a chase
 * measure to it (`ReachQuery.aimPointOf`), and a shot hits it (`ProjectileSystem`). A structure's
 * `Footprint` and a map object's `MapObjectBody` implement it; `EntityStore.outlineOf` is the one
 * place that picks which one an entity uses. Each polygon is either walked on or solid. A
 * structure's `Footprint` can hold both: the walk-on polygons of its own map object, and the solid
 * polygons of the objects that are part of its body (`Footprint.ofBody`, DEC-373 (1)). A shot not
 * aimed at the entity flies over its walk-on polygons and its `shotsCross` polygons, and stops on
 * the other solid ones (HC-Q105, Q104-9).
 */
export interface Outline {
  /** Every polygon, walked on or solid: attack reach and a chase measure to them. */
  readonly polygons: readonly Polygon[];
  /** The box around every polygon: a cheap first test before the exact polygons. */
  readonly bounds: Rect;
  /**
   * The polygons units walk on (a palace floor, a gate's passage): only a hit aimed at the entity
   * hits them (DEC-322 (1)), a shot too. Rule 1 of `AreaHitQuery.find` (melee and ability areas)
   * aims by them.
   */
  readonly walkOn: readonly Polygon[];
  /**
   * The solid polygons (a fort, a pylon, the Stronghold's outer walls and throne): every hit that
   * touches them hits the entity. A shot stops on them too, except on the `shotsCross` ones when
   * it does not aim at the entity.
   */
  readonly solid: readonly Polygon[];
  /**
   * The solid polygons that a shot not aimed at the entity flies over: the footprint of a map
   * object flagged `canShotsCross` (a camp fire's body, HC-Q105, DEC-373). They are the same
   * polygon objects as in `solid`. The shot rule (`AreaHitQuery.shotPolygonsOf`, for
   * `ProjectileSystem` and `LineOfFire` alike) reads it; a melee or ability hit does not.
   */
  readonly shotsCross: readonly Polygon[];
}
