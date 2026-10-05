import { describe, expect, it } from 'vitest';

import {
  distance,
  distanceToPath,
  distanceToSegment,
  isPointInPolygon,
  lerpPoint,
  polarPoint,
  regularPolygon,
} from './geometry';

const SQUARE = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe('geometry', () => {
  it('measures distance and interpolates points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(lerpPoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.25)).toEqual({ x: 2.5, y: 5 });
  });

  it('places polar points and regular polygons around a centre', () => {
    const east = polarPoint({ x: 1, y: 1 }, 2, 0);
    expect(east).toEqual({ x: 3, y: 1 });
    const hexagon = regularPolygon({ x: 0, y: 0 }, 5, 6);
    expect(hexagon).toHaveLength(6);
    expect(hexagon.every((point) => Math.abs(distance(point, { x: 0, y: 0 }) - 5) < 1e-9)).toBe(
      true,
    );
  });

  it('tells whether a point is inside a polygon', () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, SQUARE)).toBe(true);
    expect(isPointInPolygon({ x: 15, y: 5 }, SQUARE)).toBe(false);
    expect(isPointInPolygon({ x: 5, y: -1 }, SQUARE)).toBe(false);
  });

  it('measures distance to a segment and a path', () => {
    expect(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
    expect(distanceToSegment({ x: -3, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
    expect(distanceToPath({ x: 12, y: 5 }, SQUARE)).toBe(2);
    expect(distanceToPath({ x: 0, y: 0 }, [])).toBe(Number.POSITIVE_INFINITY);
  });
});
