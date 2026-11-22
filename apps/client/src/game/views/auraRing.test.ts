import { describe, expect, it } from 'vitest';

import { auraRing, pointOnRing } from './auraRing';

const BOX = { x: 10, y: 20, width: 30, height: 10 };

describe('auraRing', () => {
  it('outlines the box grown by the radius, its corners rounded by it, closed (DEC-323 (3))', () => {
    const ring = auraRing(BOX, 5, 4);
    const xs = ring.points.map(({ x }) => x);
    const ys = ring.points.map(({ y }) => y);

    expect(ring.points).toHaveLength(4 * (4 + 1) + 1);
    expect(ring.points.at(-1)).toEqual(ring.points[0]);
    expect(Math.min(...xs)).toBeCloseTo(5);
    expect(Math.max(...xs)).toBeCloseTo(45);
    expect(Math.min(...ys)).toBeCloseTo(15);
    expect(Math.max(...ys)).toBeCloseTo(35);
    // Every corner of the outline is the radius from the box.
    for (const { x, y } of ring.points) {
      const dx = Math.max(BOX.x - x, 0, x - (BOX.x + BOX.width));
      const dy = Math.max(BOX.y - y, 0, y - (BOX.y + BOX.height));
      expect(Math.hypot(dx, dy)).toBeCloseTo(5);
    }
  });

  it('runs clockwise on screen (y down) from the bottom end of the right edge', () => {
    const ring = auraRing(BOX, 5, 4);

    expect(ring.points[0]?.x).toBeCloseTo(45);
    expect(ring.points[0]?.y).toBeCloseTo(30);
    expect(ring.points[4]?.x).toBeCloseTo(40);
    expect(ring.points[4]?.y).toBeCloseTo(35);
    expect(ring.points[5]?.x).toBeCloseTo(10);
    expect(ring.points[5]?.y).toBeCloseTo(35);
  });

  it('measures its length along the points: the box edges plus a circle of the radius', () => {
    const ring = auraRing(BOX, 5, 64);

    expect(ring.lengths[0]).toBe(0);
    expect(ring.lengths.at(-1)).toBe(ring.perimeter);
    expect(ring.perimeter).toBeCloseTo(2 * (30 + 10) + 2 * Math.PI * 5, 1);
  });

  it('is a circle round the corner of a box of no size', () => {
    const ring = auraRing({ x: 3, y: 4, width: 0, height: 0 }, 12, 8);

    for (const { x, y } of ring.points) {
      expect(Math.hypot(x - 3, y - 4)).toBeCloseTo(12);
    }
    expect(ring.perimeter).toBeCloseTo(2 * Math.PI * 12, 0);
  });
});

describe('pointOnRing', () => {
  const ring = auraRing(BOX, 5, 4);

  it('starts at the first point and follows the outline', () => {
    const start = ring.points[0];
    const fifth = ring.points[5];
    const halfWay = pointOnRing(ring, ((ring.lengths[4] ?? 0) + (ring.lengths[5] ?? 0)) / 2);

    expect(pointOnRing(ring, 0)).toEqual(start);
    expect(pointOnRing(ring, ring.lengths[5] ?? 0).x).toBeCloseTo(fifth?.x ?? Number.NaN);
    expect(halfWay.x).toBeCloseTo(25);
    expect(halfWay.y).toBeCloseTo(35);
  });

  it('goes round as often as needed, forwards and back', () => {
    const at = pointOnRing(ring, 7);
    const later = pointOnRing(ring, 7 + 3 * ring.perimeter);
    const earlier = pointOnRing(ring, 7 - ring.perimeter);

    expect(later.x).toBeCloseTo(at.x);
    expect(later.y).toBeCloseTo(at.y);
    expect(earlier.x).toBeCloseTo(at.x);
    expect(earlier.y).toBeCloseTo(at.y);
  });

  it('gives the first point of a ring of no length', () => {
    const none = auraRing({ x: 1, y: 2, width: 0, height: 0 }, 0, 4);

    expect(pointOnRing(none, 9)).toEqual(none.points[0]);
  });
});
