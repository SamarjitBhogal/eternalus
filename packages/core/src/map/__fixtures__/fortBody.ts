import type { MapObject } from '../../content/maps/mapObjects.types';
import type { Polygon, Rect, Vec2 } from '../../utils/geometry.types';

/** A lane tower's body objects: its own object and its fort's wall pieces (`partOf`, DEC-217 (12)). */
export const bodyObjectsOf = (objects: readonly MapObject[], id: string): readonly MapObject[] =>
  objects.filter((object) => object.id === id || object.partOf === id);

/** The collider polygons of `bodyObjectsOf`. */
export const bodyOf = (objects: readonly MapObject[], id: string): readonly Polygon[] =>
  bodyObjectsOf(objects, id).flatMap(({ footprints }) => footprints);

/** A tower's walls, as the box around its collider polygons: its hollow core and doorways. */
export const wallBox = (objects: readonly MapObject[], id: string) => {
  const points = bodyOf(objects, id).flat();
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
};

/** The same box as a `Rect`: a lane tower's fort as its `Footprint` bounds it. */
export const fortBox = (objects: readonly MapObject[], id: string): Rect => {
  const { left, right, top, bottom } = wallBox(objects, id);
  return { x: left, y: top, width: right - left, height: bottom - top };
};

/** The side of `box` that `point`, just outside or inside it, is nearest to. */
export const sideOf = (point: Vec2, box: Rect): 'west' | 'east' | 'north' | 'south' => {
  const dx = point.x - (box.x + box.width / 2);
  const dy = point.y - (box.y + box.height / 2);
  if (Math.abs(dx) / box.width >= Math.abs(dy) / box.height) return dx < 0 ? 'west' : 'east';
  return dy < 0 ? 'north' : 'south';
};
