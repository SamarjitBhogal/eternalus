import type { Polygon, Rect } from '../utils/geometry.types';

/** A static polygon with an owning object so destruction can remove all of its shapes. */
export type StaticCollisionShape = {
  readonly id: string;
  readonly polygon: Polygon;
  readonly passages?: readonly Polygon[];
};

/** Cached bounds used by the broad phase. */
export type IndexedPolygon = StaticCollisionShape & { readonly bounds: Rect };
