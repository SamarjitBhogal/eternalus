import type { MapObject, MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { Vec2 } from '../utils/geometry.types';
import { isPointInPolygon } from '../utils/geometry';

/** Selects a living destructible object by its exact polygon, preferring small objects over buildings. */
export const findMapObjectAt = (
  objects: readonly MapObject[],
  states: readonly MapObjectSnapshot[],
  point: Vec2,
): string | null => {
  const candidates = new Map(
    states
      .filter((state) => !state.isDestroyed && state.health !== null)
      .map((state) => [state.id, state.entityId]),
  );
  let selected: string | null = null;
  let smallest = Infinity;
  for (const object of objects) {
    const entityId = candidates.get(object.id);
    if (entityId == null || !object.footprints.some((shape) => isPointInPolygon(point, shape)))
      continue;
    const points = object.footprints.flat();
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    if (area < smallest) {
      selected = entityId;
      smallest = area;
    }
  }
  return selected;
};
