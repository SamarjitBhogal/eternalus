import { describe, expect, it } from 'vitest';

import { LaneGeometry } from './LaneGeometry';

// An L-shaped path: 30 units east, then 40 units south. Total length 70.
const L_PATH = new LaneGeometry([
  { x: 0, y: 0 },
  { x: 30, y: 0 },
  { x: 30, y: 40 },
]);

describe('LaneGeometry', () => {
  it('measures the path length', () => {
    expect(L_PATH.length).toBe(70);
  });

  it('finds the point a fraction of the way along by length', () => {
    expect(L_PATH.pointAt(0)).toEqual({ x: 0, y: 0 });
    expect(L_PATH.pointAt(3 / 7)).toEqual({ x: 30, y: 0 });
    expect(L_PATH.pointAt(0.5).y).toBeCloseTo(5);
    expect(L_PATH.pointAt(1)).toEqual({ x: 30, y: 40 });
  });

  it('clamps fractions outside 0..1', () => {
    expect(L_PATH.pointAt(-1)).toEqual({ x: 0, y: 0 });
    expect(L_PATH.pointAt(2)).toEqual({ x: 30, y: 40 });
  });

  it('reads the y at an x on an eastward path', () => {
    const lane = new LaneGeometry([
      { x: 0, y: 100 },
      { x: 100, y: 0 },
      { x: 200, y: 0 },
    ]);

    expect(lane.yAtX(50)).toBe(50);
    expect(lane.yAtX(150)).toBe(0);
    expect(lane.yAtX(-10)).toBe(100);
    expect(lane.yAtX(500)).toBe(0);
  });

  it('handles a single-point path', () => {
    const point = new LaneGeometry([{ x: 5, y: 5 }]);

    expect(point.length).toBe(0);
    expect(point.pointAt(0.5)).toEqual({ x: 5, y: 5 });
  });
});
