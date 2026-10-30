import type { Polygon, Vec2 } from '../utils/geometry.types';
import { distanceToSegment, isPointInPolygon } from '../utils/geometry';
import { CONTACT_EPSILON } from './CollisionResolver.constants';

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
