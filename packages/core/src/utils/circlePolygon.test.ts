import { describe, expect, it } from 'vitest';
import {
  circlePenetration,
  doesCapsuleReachPolygon,
  doesCircleOverlapPolygon,
  doesDiscReachPolygon,
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
  it('reaches a polygon with a disc: centre inside, or outline within the radius, touching counts', () => {
    expect(doesDiscReachPolygon({ x: 5, y: 5 }, 0, SHAPE)).toBe(true);
    expect(doesDiscReachPolygon({ x: -1, y: 5 }, 1, SHAPE)).toBe(true);
    expect(doesDiscReachPolygon({ x: -1.1, y: 5 }, 1, SHAPE)).toBe(false);
    expect(doesDiscReachPolygon({ x: 11, y: 5 }, 1, SHAPE)).toBe(true); // the closing edge
    expect(doesDiscReachPolygon({ x: 5, y: 5 }, 1, [])).toBe(false);
  });

  it('reaches a polygon with a capsule: beside it, by either end, or crossing it', () => {
    const reaches = (from: { x: number; y: number }, to: { x: number; y: number }, radius = 1) =>
      doesCapsuleReachPolygon(from, to, radius, SHAPE);

    expect(reaches({ x: -20, y: 11 }, { x: 20, y: 11 })).toBe(true); // a corner side
    expect(reaches({ x: -20, y: 11.1 }, { x: 20, y: 11.1 })).toBe(false);
    expect(reaches({ x: -5, y: 5 }, { x: -1, y: 5 })).toBe(true); // the end
    expect(reaches({ x: -1, y: 5 }, { x: -5, y: 5 })).toBe(true); // the start
    expect(reaches({ x: 5, y: -50 }, { x: 5, y: 50 }, 0)).toBe(true); // straight through
    expect(reaches({ x: 20, y: -50 }, { x: 20, y: 50 }, 0)).toBe(false);
    expect(doesCapsuleReachPolygon({ x: 0, y: 0 }, { x: 1, y: 1 }, 1, [])).toBe(false);
  });
});
