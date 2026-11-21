import { sqrt } from './deterministicMath';
import { distance, distanceToSegment } from './geometry';
import type { Polygon, Vec2 } from './geometry.types';
import { dot } from './vec2';

/**
 * Exact tests of a circular sector (a wedge of a disc), the area a melee sweep reaches (DEC-184).
 * The sector has its tip at `origin`, points along the unit vector `direction`, reaches `radius`
 * and spans an angle whose half has the cosine `cosHalfArc`. The arc must be at most 180 degrees
 * (`cosHalfArc >= 0`), which makes the sector convex: a body touches it if it is inside it or
 * touches one of its two straight edges or its curved edge. Hand the cosine in (from
 * `deterministicMath.cos`) so no test calls a transcendental function. Lane B's cone abilities can
 * reuse these.
 */

/** The two straight edges of a sector, as end points and inward normals. */
type SectorEdges = {
  readonly tips: readonly [Vec2, Vec2];
  readonly normals: readonly [Vec2, Vec2];
};

/** The sector's edges: `direction` turned by plus and minus half the arc. */
const edgesOf = (
  origin: Vec2,
  direction: Vec2,
  radius: number,
  cosHalfArc: number,
): SectorEdges => {
  const sinHalfArc = sqrt(Math.max(0, 1 - cosHalfArc * cosHalfArc));
  const left = {
    x: direction.x * cosHalfArc - direction.y * sinHalfArc,
    y: direction.y * cosHalfArc + direction.x * sinHalfArc,
  };
  const right = {
    x: direction.x * cosHalfArc + direction.y * sinHalfArc,
    y: direction.y * cosHalfArc - direction.x * sinHalfArc,
  };
  return {
    tips: [
      { x: origin.x + left.x * radius, y: origin.y + left.y * radius },
      { x: origin.x + right.x * radius, y: origin.y + right.y * radius },
    ],
    normals: [
      { x: left.y, y: -left.x },
      { x: -right.y, y: right.x },
    ],
  };
};

/** Whether `point` lies inside the sector's angle (the infinite wedge), the tip included. */
const isInAngle = (origin: Vec2, direction: Vec2, cosHalfArc: number, point: Vec2): boolean => {
  const offset = { x: point.x - origin.x, y: point.y - origin.y };
  const gap = sqrt(dot(offset, offset));
  return gap === 0 || dot(offset, direction) >= cosHalfArc * gap;
};

/** Whether `point` lies inside the sector, edges included. */
export const isPointInSector = (
  origin: Vec2,
  direction: Vec2,
  radius: number,
  cosHalfArc: number,
  point: Vec2,
): boolean => distance(origin, point) <= radius && isInAngle(origin, direction, cosHalfArc, point);

/**
 * Whether the disc at `centre` with `discRadius` overlaps or touches the sector. True when the
 * disc's centre is inside the sector's angle and within `radius + discRadius`, or when the disc
 * touches one of the two straight edges (a disc whose centre is outside the angle).
 */
export const doesSectorReachDisc = (
  origin: Vec2,
  direction: Vec2,
  radius: number,
  cosHalfArc: number,
  centre: Vec2,
  discRadius: number,
): boolean => {
  if (distance(origin, centre) > radius + discRadius) {
    return false;
  }
  if (isInAngle(origin, direction, cosHalfArc, centre)) {
    return true;
  }
  const { tips } = edgesOf(origin, direction, radius, cosHalfArc);
  return tips.some((tip) => distanceToSegment(centre, origin, tip) <= discRadius);
};

/**
 * The part of the segment `from`-`to` that lies in the sector's infinite wedge (the two
 * half-planes through the edges), or `null` when none does. Clips by each edge's inward normal.
 */
const clipToWedge = (
  origin: Vec2,
  normals: SectorEdges['normals'],
  from: Vec2,
  to: Vec2,
): readonly [Vec2, Vec2] | null => {
  let start = 0;
  let end = 1;
  for (const normal of normals) {
    const fromSide = normal.x * (from.x - origin.x) + normal.y * (from.y - origin.y);
    const toSide = normal.x * (to.x - origin.x) + normal.y * (to.y - origin.y);
    if (fromSide < 0 && toSide < 0) {
      return null;
    }
    const crossing = fromSide / (fromSide - toSide);
    if (fromSide < 0) {
      start = Math.max(start, crossing);
    } else if (toSide < 0) {
      end = Math.min(end, crossing);
    }
  }
  if (start > end) {
    return null;
  }
  const at = (t: number): Vec2 => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  });
  return [at(start), at(end)];
};

/**
 * Whether the outline of `polygon` touches the sector: a corner is inside it, or an edge, clipped
 * to the wedge, comes within `radius` of the tip (an edge can cross the sector with no corner
 * inside). A sector that lies wholly inside the polygon is not reported: test the tip with
 * `isPointInPolygon` for that.
 */
export const doesSectorReachPolygon = (
  origin: Vec2,
  direction: Vec2,
  radius: number,
  cosHalfArc: number,
  polygon: Polygon,
): boolean => {
  if (polygon.some((corner) => isPointInSector(origin, direction, radius, cosHalfArc, corner))) {
    return true;
  }
  const { normals } = edgesOf(origin, direction, radius, cosHalfArc);
  return polygon.some((corner, index) => {
    const next = polygon[(index + 1) % polygon.length] ?? corner;
    const clipped = clipToWedge(origin, normals, corner, next);
    return clipped !== null && distanceToSegment(origin, clipped[0], clipped[1]) <= radius;
  });
};
