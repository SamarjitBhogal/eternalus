import type { Polygon, Vec2 } from './geometry.types';
import {
  closestPointOnSegment,
  distance,
  distanceToPath,
  distanceToSegment,
  doSegmentsIntersect,
  isPointInPolygon,
} from './geometry';
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
 * Whether a disc of `radius` at `centre` reaches `shape`: the centre is inside it, or its outline is
 * at most `radius` away (touching counts, unlike `doesCircleOverlapPolygon`). How a basic attack
 * reaches a map object (`EntityStore.isInReach`) and an ability's circle hits one. `false` for a
 * shape with no corners.
 */
export const doesDiscReachPolygon = (centre: Vec2, radius: number, shape: Polygon): boolean => {
  const first = shape[0];
  const last = shape.at(-1);
  return (
    first !== undefined &&
    last !== undefined &&
    (isPointInPolygon(centre, shape) ||
      Math.min(distanceToPath(centre, shape), distanceToSegment(centre, last, first)) <= radius)
  );
};

/**
 * Whether the capsule of `radius` around the segment `from`–`to` reaches `shape`: either end's disc
 * reaches it, a corner is within `radius` of the segment, or the segment crosses an edge (a path
 * straight through a building). Touching counts. `false` for a shape with no corners.
 */
export const doesCapsuleReachPolygon = (
  from: Vec2,
  to: Vec2,
  radius: number,
  shape: Polygon,
): boolean =>
  doesDiscReachPolygon(from, radius, shape) ||
  doesDiscReachPolygon(to, radius, shape) ||
  shape.some(
    (corner, i) =>
      distanceToSegment(corner, from, to) <= radius ||
      doSegmentsIntersect(from, to, corner, shape[(i + 1) % shape.length] ?? corner),
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
