import type { Polygon, Rect } from '../utils/geometry.types';

/**
 * An entity's exact outline, used instead of its collider circle: attack reach and a chase
 * measure to it (`ReachQuery.aimPointOf`), and a shot hits it (`ProjectileSystem`). A structure's
 * `Footprint` and a map object's `MapObjectBody` implement it; `EntityStore.outlineOf` is the one
 * place that picks which one an entity uses. Each polygon is either walked on or solid. A
 * structure's `Footprint` can hold both: the walk-on polygons of its own map object, and the solid
 * polygons of the objects that are part of its body (`Footprint.ofBody`, DEC-373 (1)).
 */
export interface Outline {
  /** Every polygon, walked on or solid: attack reach and a chase measure to them. */
  readonly polygons: readonly Polygon[];
  /** The box around every polygon: a cheap first test before the exact polygons. */
  readonly bounds: Rect;
  /**
   * The polygons units walk on (a palace floor, a gate's passage): only a hit aimed at the entity
   * hits them (DEC-322 (1)).
   */
  readonly walkOn: readonly Polygon[];
  /**
   * The solid polygons (a fort, a pylon, the Stronghold's outer walls and throne): every hit that
   * touches them hits the entity.
   */
  readonly solid: readonly Polygon[];
}
