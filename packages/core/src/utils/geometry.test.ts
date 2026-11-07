import { describe, expect, it } from 'vitest';

import {
  boundsOf,
  distance,
  doesPolygonOverlapRect,
  distanceToPath,
  distanceToSegment,
  isPointInPolygon,
  lerpPoint,
  nearestPointOnPolygons,
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

  it('boxes a set of points, and gives an empty box for no points', () => {
    expect(boundsOf([{ x: 3, y: -1 }, ...SQUARE])).toEqual({ x: 0, y: -1, width: 10, height: 11 });
    expect(boundsOf([])).toEqual({
      x: Infinity,
      y: Infinity,
      width: -Infinity,
      height: -Infinity,
    });
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

  it('writes the nearest point of several outlines into out, closing edges included', () => {
    const square = [
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
    ];
    const far = [
      { x: 40, y: 0 },
      { x: 50, y: 0 },
      { x: 45, y: 10 },
    ];
    const out = { x: -1, y: -1 };

    // The closing edge (10, 10) → (10, 0) is the nearest one.
    expect(nearestPointOnPolygons({ x: 7, y: 4 }, [far, square], out)).toBe(3);
    expect(out).toEqual({ x: 10, y: 4 });
    // A corner, when the point is past both of its edges.
    expect(nearestPointOnPolygons({ x: 23, y: 14 }, [square], out)).toBe(5);
    expect(out).toEqual({ x: 20, y: 10 });
    // No corners: Infinity, and `out` keeps what it held.
    expect(nearestPointOnPolygons({ x: 0, y: 0 }, [], out)).toBe(Number.POSITIVE_INFINITY);
    expect(out).toEqual({ x: 20, y: 10 });
  });
});
