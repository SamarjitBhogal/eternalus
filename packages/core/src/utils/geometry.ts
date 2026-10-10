import { cos, sin } from './deterministicMath';
import type { Polygon, Rect, Vec2 } from './geometry.types';

/** Radians per degree; angles in content are authored in degrees. */
export const RADIANS_PER_DEGREE = Math.PI / 180;

/** Straight-line distance between two points (`sqrt` is exactly rounded, so it is deterministic). */
export const distance = (a: Vec2, b: Vec2): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/** The point a fraction `t` of the way from `a` to `b`. */
export const lerpPoint = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/**
 * The point `radius` away from `centre` in direction `angle` (radians, 0 = east, clockwise on
 * screen). The map code's only trigonometry, through `utils/deterministicMath.ts` (ADR 0012); the
 * golden-hash test in `MapGenerator.test.ts` catches drift.
 */
export const polarPoint = (centre: Vec2, radius: number, angle: number): Vec2 => ({
  x: centre.x + cos(angle) * radius,
  y: centre.y + sin(angle) * radius,
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

/** Which side of the line `a`→`b` the point `c` is on: positive, negative or 0 (on the line). */
const orientation = (a: Vec2, b: Vec2, c: Vec2): number =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/** Whether segments `a`–`b` and `c`–`d` touch or cross (collinear overlaps count). */
const doSegmentsIntersect = (a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean => {
  const isWithin = (p: Vec2, q: Vec2, r: Vec2): boolean =>
    Math.min(p.x, q.x) <= r.x &&
    r.x <= Math.max(p.x, q.x) &&
    Math.min(p.y, q.y) <= r.y &&
    r.y <= Math.max(p.y, q.y);
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 * o2 < 0 && o3 * o4 < 0) {
    return true;
  }
  return (
    (o1 === 0 && isWithin(a, b, c)) ||
    (o2 === 0 && isWithin(a, b, d)) ||
    (o3 === 0 && isWithin(c, d, a)) ||
    (o4 === 0 && isWithin(c, d, b))
  );
};

/** The four corners of a rectangle, clockwise from the top-left. */
const rectCorners = (rect: Rect): Polygon => [
  { x: rect.x, y: rect.y },
  { x: rect.x + rect.width, y: rect.y },
  { x: rect.x + rect.width, y: rect.y + rect.height },
  { x: rect.x, y: rect.y + rect.height },
];

/**
 * Whether a polygon covers any part of a rectangle: a vertex inside the rectangle, the
 * rectangle inside the polygon, or crossing edges. Used to mark grid cells conservatively, so
 * a wall thinner than a cell still blocks it.
 */
export const doesPolygonOverlapRect = (polygon: Polygon, rect: Rect): boolean => {
  const corners = rectCorners(rect);
  const isInsideRect = (point: Vec2): boolean =>
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height;
  if (polygon.some(isInsideRect) || corners.some((corner) => isPointInPolygon(corner, polygon))) {
    return true;
  }
  return polygon.some((start, index) => {
    const end = polygon[(index + 1) % polygon.length] ?? start;
    return corners.some((corner, cornerIndex) =>
      doSegmentsIntersect(start, end, corner, corners[(cornerIndex + 1) % 4] ?? corner),
    );
  });
};
