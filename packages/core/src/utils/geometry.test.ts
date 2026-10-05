import { describe, expect, it } from 'vitest';

import {
  distance,
  doesPolygonOverlapRect,
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

  it('tells whether a polygon covers any part of a rectangle', () => {
    const cell = { x: 10, y: 10, width: 10, height: 10 };
    // A thin diagonal sliver crossing the cell without covering its centre or corners.
    const sliver = [
      { x: 8, y: 20.5 },
      { x: 9, y: 20.5 },
      { x: 21, y: 9 },
      { x: 20, y: 9 },
    ];

    expect(doesPolygonOverlapRect(sliver, cell)).toBe(true);
    expect(doesPolygonOverlapRect(SQUARE, cell)).toBe(true);
    expect(
      doesPolygonOverlapRect(
        [
          { x: 12, y: 12 },
          { x: 14, y: 12 },
          { x: 13, y: 14 },
        ],
        cell,
      ),
    ).toBe(true);
    expect(
      doesPolygonOverlapRect(
        [
          { x: 30, y: 30 },
          { x: 40, y: 30 },
          { x: 35, y: 40 },
        ],
        cell,
      ),
    ).toBe(false);
    // A big square that contains the whole cell.
    expect(
      doesPolygonOverlapRect(
        [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
          { x: 0, y: 50 },
        ],
        cell,
      ),
    ).toBe(true);
  });
});
