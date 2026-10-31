import { describe, expect, it } from 'vitest';
import {
  circlePenetration,
  doesCircleOverlapPolygon,
  isCircleInsidePolygon,
} from './circlePolygon';
const SHAPE = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];
describe('circle-polygon checks', () => {
  it('distinguishes fitting a doorway from overlapping its wall edge', () => {
    expect(isCircleInsidePolygon({ x: 5, y: 5 }, 1, SHAPE)).toBe(true);
    expect(isCircleInsidePolygon({ x: 0.5, y: 5 }, 1, SHAPE)).toBe(false);
    expect(doesCircleOverlapPolygon({ x: -0.5, y: 5 }, 1, SHAPE)).toBe(true);
    expect(doesCircleOverlapPolygon({ x: -1, y: 5 }, 1, SHAPE)).toBe(false);
    expect(doesCircleOverlapPolygon({ x: 5, y: 5 }, 1, SHAPE)).toBe(true);
    expect(doesCircleOverlapPolygon({ x: 5, y: 5 }, 1, [])).toBe(false);
  });
  it('measures how deep a circle reaches into a polygon and which way leads out', () => {
    expect(circlePenetration({ x: 2, y: 5 }, 1, SHAPE)).toEqual({
      depth: 3,
      normal: { x: -1, y: -0 },
    });
    expect(circlePenetration({ x: -0.5, y: 5 }, 1, SHAPE)).toEqual({
      depth: 0.5,
      normal: { x: -1, y: 0 },
    });
    const onEdge = circlePenetration({ x: 0, y: 5 }, 1, SHAPE).normal;
    expect(Math.hypot(onEdge.x, onEdge.y)).toBe(0);
  });
});
