import type { MapObjectFlags } from '../content/maps/mapObjects.types';
import type { Polygon, Rect } from '../utils/geometry.types';

/**
 * A static polygon with an owning object so destruction can remove all of its shapes. The flags
 * are the object's (`MapObjectFlags`): a shot flies over low ground and catches fire over fire.
 */
export type StaticCollisionShape = MapObjectFlags & {
  readonly id: string;
  readonly polygon: Polygon;
  readonly passages?: readonly Polygon[];
};

/** Cached bounds used by the broad phase. */
export type IndexedPolygon = StaticCollisionShape & { readonly bounds: Rect };
