import { describe, expect, it } from 'vitest';

import {
  boundsOf,
  distance,
  distanceSquaredToRect,
  doRectsOverlap,
  doesPolygonOverlapRect,
  doPolygonsOverlap,
  distanceToPath,
  distanceToSegment,
  doesRayCrossPolygon,
  isPointInAnyPolygon,
  isPointInPolygon,
  isPointInRect,
  isPolygon,
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

  it('accepts a polygon of at least 3 finite corners only', () => {
    expect(isPolygon(SQUARE)).toBe(true);
    expect(isPolygon(SQUARE.slice(0, 2))).toBe(false);
    expect(isPolygon([...SQUARE.slice(0, 3), { x: Number.NaN, y: 0 }])).toBe(false);
    expect(isPolygon([...SQUARE.slice(0, 3), { x: 0, y: Infinity }])).toBe(false);
  });

  it('tells whether a ray crosses a polygon ahead of its start, and never behind it', () => {
    expect(doesRayCrossPolygon({ x: -5, y: 5 }, { x: 1, y: 0 }, SQUARE)).toBe(true);
    expect(doesRayCrossPolygon({ x: -5, y: 0 }, { x: 1, y: 1 }, SQUARE)).toBe(true);
    // From inside, the ray always crosses on its way out.
    expect(doesRayCrossPolygon({ x: 5, y: 5 }, { x: 0, y: -3 }, SQUARE)).toBe(true);
    // The square is behind the start.
    expect(doesRayCrossPolygon({ x: -5, y: 5 }, { x: -1, y: 0 }, SQUARE)).toBe(false);
    // The ray meets the lines of two edges (x = 0 at y = 15, y = 10 at x = -2.5), but off the edges.
    expect(doesRayCrossPolygon({ x: -5, y: 5 }, { x: 1, y: 2 }, SQUARE)).toBe(false);
    expect(doesRayCrossPolygon({ x: -5, y: 15 }, { x: 1, y: 0 }, SQUARE)).toBe(false);
    expect(doesRayCrossPolygon({ x: -5, y: 5 }, { x: 0, y: 0 }, SQUARE)).toBe(false);
  });

  it('tells whether a point is in an upright rectangle, edges included', () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };
    expect(isPointInRect({ x: 25, y: 40 }, rect)).toBe(true);
    expect(isPointInRect({ x: 10, y: 20 }, rect)).toBe(true);
    expect(isPointInRect({ x: 40, y: 60 }, rect)).toBe(true);
    expect(isPointInRect({ x: 9.9, y: 40 }, rect)).toBe(false);
    expect(isPointInRect({ x: 40.1, y: 40 }, rect)).toBe(false);
    expect(isPointInRect({ x: 25, y: 19.9 }, rect)).toBe(false);
    expect(isPointInRect({ x: 25, y: 60.1 }, rect)).toBe(false);
  });

  it('measures the squared distance to an upright rectangle: 0 inside, to an edge or a corner outside', () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };
    expect(distanceSquaredToRect({ x: 25, y: 40 }, rect)).toBe(0);
    expect(distanceSquaredToRect({ x: 40, y: 60 }, rect)).toBe(0);
    expect(distanceSquaredToRect({ x: 4, y: 40 }, rect)).toBe(36);
    expect(distanceSquaredToRect({ x: 25, y: 65 }, rect)).toBe(25);
    expect(distanceSquaredToRect({ x: 43, y: 64 }, rect)).toBe(25);
    expect(distanceSquaredToRect({ x: 7, y: 16 }, rect)).toBe(25);
  });

  it('tells whether two upright rectangles overlap, touching edges included', () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 };
    const small = (x: number, y: number) => ({ x, y, width: 5, height: 5 });
    expect(doRectsOverlap(rect, small(20, 30))).toBe(true);
    expect(doRectsOverlap(rect, { x: 0, y: 0, width: 100, height: 100 })).toBe(true);
    expect(doRectsOverlap(rect, small(40, 60))).toBe(true);
    expect(doRectsOverlap(rect, small(5, 20))).toBe(true);
    expect(doRectsOverlap(rect, small(40.1, 30))).toBe(false);
    expect(doRectsOverlap(rect, small(4.9, 30))).toBe(false);
    expect(doRectsOverlap(rect, small(20, 60.1))).toBe(false);
    expect(doRectsOverlap(rect, small(20, 14.9))).toBe(false);
    expect(doRectsOverlap(boundsOf([]), rect)).toBe(false);
  });

  it('tells whether a point is inside any of several polygons', () => {
    const farSquare = SQUARE.map(({ x, y }) => ({ x: x + 20, y }));
    expect(isPointInAnyPolygon({ x: 5, y: 5 }, [SQUARE, farSquare])).toBe(true);
    expect(isPointInAnyPolygon({ x: 25, y: 5 }, [SQUARE, farSquare])).toBe(true);
    expect(isPointInAnyPolygon({ x: 15, y: 5 }, [SQUARE, farSquare])).toBe(false);
    expect(isPointInAnyPolygon({ x: 5, y: 5 }, [])).toBe(false);
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

  it('tells whether two polygons share any point (HC-Q95)', () => {
    const triangle = (x: number, y: number) => [
      { x, y },
      { x: x + 4, y },
      { x: x + 2, y: y + 4 },
    ];
    // Crossing edges with no corner inside the other polygon: a thin bar across SQUARE.
    const bar = [
      { x: -5, y: 4 },
      { x: 15, y: 4 },
      { x: 15, y: 6 },
      { x: -5, y: 6 },
    ];

    expect(doPolygonsOverlap(SQUARE, bar)).toBe(true);
    expect(doPolygonsOverlap(SQUARE, triangle(3, 3))).toBe(true);
    expect(doPolygonsOverlap(triangle(3, 3), SQUARE)).toBe(true);
    expect(doPolygonsOverlap(SQUARE, triangle(10, 0))).toBe(true);
    expect(doPolygonsOverlap(SQUARE, triangle(30, 30))).toBe(false);
    expect(doPolygonsOverlap(SQUARE, [{ x: 5, y: 5 }])).toBe(true);
    expect(doPolygonsOverlap(SQUARE, [{ x: 50, y: 5 }])).toBe(false);
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
