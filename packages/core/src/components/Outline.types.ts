import type { Polygon, Rect } from '../utils/geometry.types';

/**
 * An entity's exact outline, used instead of its collider circle: attack reach and a chase
 * measure to it (`EntityStore.aimPointOf`), and a shot hits it (`ProjectileSystem`). A structure's
 * `Footprint` and a map object's `MapObjectBody` implement it; `EntityStore.outlineOf` is the one
 * place that picks which one an entity uses.
 */
export interface Outline {
  /** The world-space polygons, each with at least 3 corners. */
  readonly polygons: readonly Polygon[];
  /** The box around every polygon: a cheap first test before the exact polygons. */
  readonly bounds: Rect;
  /** Units walk on it (a palace floor, a gate's passage): only a hit aimed at it hits it (DEC-322). */
  readonly isWalkOn: boolean;
}
