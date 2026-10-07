import type { Polygon, Vec2 } from '../utils/geometry.types';

/**
 * Mirrors a point across the vertical centre line of a world `worldWidth` wide. Light sits on
 * the west half and Dark on the east half, so every Dark feature is the mirror of a Light one.
 */
export const mirrorPoint = (point: Vec2, worldWidth: number): Vec2 => ({
  x: worldWidth - point.x,
  y: point.y,
});

/** Mirrors every point of a polygon; see {@link mirrorPoint}. */
export const mirrorPolygon = (polygon: Polygon, worldWidth: number): Polygon =>
  polygon.map((point) => mirrorPoint(point, worldWidth));
