import type { Polygon, Vec2 } from './geometry.types';
import { closestPointOnSegment, distance, distanceToSegment, isPointInPolygon } from './geometry';
import { CONTACT_EPSILON } from './circlePolygon.constants';
import type { CirclePenetration } from './circlePolygon.types';

/** Whether a whole unit circle fits inside an authored bridge passage. */
export const isCircleInsidePolygon = (point: Vec2, radius: number, shape: Polygon): boolean =>
  isPointInPolygon(point, shape) &&
  shape.every(
    (a, i) =>
      distanceToSegment(point, a, shape[(i + 1) % shape.length] ?? a) >= radius - CONTACT_EPSILON,
  );

/** Circle overlap with arbitrary polygons, excluding harmless touching. */
export const doesCircleOverlapPolygon = (point: Vec2, radius: number, shape: Polygon): boolean =>
  isPointInPolygon(point, shape) ||
  shape.some(
    (a, i) =>
      distanceToSegment(point, a, shape[(i + 1) % shape.length] ?? a) < radius - CONTACT_EPSILON,
  );

/**
 * How deep a circle at `point` reaches into `shape`, and the way out: away from the nearest edge
 * point when the centre is outside, towards it when the centre is inside. The normal is zero when
 * the centre lies exactly on an edge.
 */
export const circlePenetration = (
  point: Vec2,
  radius: number,
  shape: Polygon,
): CirclePenetration => {
  let nearest = point;
  let gap = Number.POSITIVE_INFINITY;
  shape.forEach((a, i) => {
    const candidate = closestPointOnSegment(point, a, shape[(i + 1) % shape.length] ?? a);
    const span = distance(point, candidate);
    if (span < gap) {
      gap = span;
      nearest = candidate;
    }
  });
  const away =
    gap === 0 ? { x: 0, y: 0 } : { x: (point.x - nearest.x) / gap, y: (point.y - nearest.y) / gap };
  return isPointInPolygon(point, shape)
    ? { depth: radius + gap, normal: { x: -away.x, y: -away.y } }
    : { depth: radius - gap, normal: away };
};
