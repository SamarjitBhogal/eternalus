import type { Polygon, Vec2 } from './geometry.types';

/** Straight-line distance between two points. */
export const distance = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.y - a.y);

/** The point a fraction `t` of the way from `a` to `b`. */
export const lerpPoint = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** The point `radius` away from `centre` in direction `angle` (radians, 0 = east, clockwise on screen). */
export const polarPoint = (centre: Vec2, radius: number, angle: number): Vec2 => ({
  x: centre.x + Math.cos(angle) * radius,
  y: centre.y + Math.sin(angle) * radius,
});

/** A regular polygon with `sides` corners around `centre`, used as a round footprint. */
export const regularPolygon = (centre: Vec2, radius: number, sides: number): Polygon =>
  Array.from({ length: sides }, (_, index) =>
    polarPoint(centre, radius, (index / sides) * 2 * Math.PI),
  );

/** Whether `point` lies inside `polygon` (even-odd rule; points on an edge may go either way). */
export const isPointInPolygon = (point: Vec2, polygon: Polygon): boolean => {
  let isInside = false;
  polygon.forEach((current, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length] ?? current;
    const crossesRow = current.y > point.y !== previous.y > point.y;
    if (crossesRow) {
      const edgeX =
        current.x + ((point.y - current.y) / (previous.y - current.y)) * (previous.x - current.x);
      if (point.x < edgeX) {
        isInside = !isInside;
      }
    }
  });
  return isInside;
};

/** Shortest distance from `point` to the segment from `a` to `b`. */
export const distanceToSegment = (point: Vec2, a: Vec2, b: Vec2): number => {
  const lengthSquared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (lengthSquared === 0) {
    return distance(point, a);
  }
  const t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / lengthSquared;
  return distance(point, lerpPoint(a, b, Math.min(Math.max(t, 0), 1)));
};

/** Shortest distance from `point` to a polyline. `Infinity` for an empty path. */
export const distanceToPath = (point: Vec2, path: readonly Vec2[]): number =>
  path.reduce((best, current, index) => {
    const next = path[index + 1];
    const candidate =
      next === undefined ? distance(point, current) : distanceToSegment(point, current, next);
    return Math.min(best, candidate);
  }, Number.POSITIVE_INFINITY);
