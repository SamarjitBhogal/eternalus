import { describe, expect, it } from 'vitest';
import { sweepCircle } from './sweepCircle';

const WALL = [
  { x: 5, y: -5 },
  { x: 6, y: -5 },
  { x: 6, y: 5 },
  { x: 5, y: 5 },
];

describe('sweepCircle', () => {
  it('finds a thin wall even when a whole tick would pass beyond it', () => {
    const hit = sweepCircle({ x: 0, y: 0 }, { x: 100, y: 0 }, 1, WALL);
    expect(hit?.time).toBeCloseTo(0.04);
    expect(hit?.normal).toEqual({ x: -1, y: 0 });
  });

  it('allows passage past a wall and movement parallel to it', () => {
    expect(sweepCircle({ x: 0, y: 7 }, { x: 100, y: 0 }, 1, WALL)).toBeNull();
    expect(sweepCircle({ x: 4, y: 0 }, { x: 0, y: 2 }, 1, WALL)).toBeNull();
    expect(sweepCircle({ x: 4, y: 0 }, { x: -2, y: 0 }, 1, WALL)).toBeNull();
    expect(sweepCircle({ x: 0, y: 0 }, { x: 0, y: 0 }, 1, [])).toBeNull();
  });

  it('catches rounded corners from either winding direction', () => {
    const delta = { x: 10, y: 0 };
    const hit = sweepCircle({ x: 0, y: 5.5 }, delta, 1, WALL);
    expect(hit?.time).toBeCloseTo((5 - Math.sqrt(0.75)) / 10);
    expect(sweepCircle({ x: 0, y: 5.5 }, delta, 1, [...WALL].reverse())?.time).toBe(hit?.time);
    expect(sweepCircle({ x: 0, y: 0 }, delta, 1, [{ x: 5, y: 0 }])?.time).toBeCloseTo(0.4);
  });
});
