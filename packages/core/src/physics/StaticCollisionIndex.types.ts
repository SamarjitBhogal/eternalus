import type { Polygon, Rect } from '../utils/geometry.types';

/**
 * A static polygon with an owning object so destruction can remove all of its shapes. A map
 * builder sets the shot flags (the object's, `staticCollisionIndexOf` copies them); a shape
 * without them stops a shot.
 */
export type StaticCollisionShape = {
  readonly id: string;
  readonly polygon: Polygon;
  readonly passages?: readonly Polygon[];
  /** A shot flies over the shape: it does not stop the shot. A mover or a dash still stops. */
  readonly canShotsCross?: true;
  /** A shot that flies over the shape, outside its passages, catches fire (`lightsShot`). */
  readonly canLightShots?: true;
};

/** Cached bounds used by the broad phase. */
export type IndexedPolygon = StaticCollisionShape & { readonly bounds: Rect };
