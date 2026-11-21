import { describe, expect, it } from 'vitest';
import { sweepDisc } from './sweepDisc';

describe('sweepDisc', () => {
  it('finds the share of the move at which the circles first touch', () => {
    // Gap 10 - 0.15 - 1 = 8.85 m of a 20 m move.
    expect(sweepDisc({ x: 0, y: 0 }, { x: 20, y: 0 }, 0.15, { x: 10, y: 0 }, 1)).toBeCloseTo(
      8.85 / 20,
    );
  });

  it('is 0 when the circles already overlap at the start', () => {
    expect(sweepDisc({ x: 0, y: 0 }, { x: 5, y: 0 }, 0.15, { x: 0.5, y: 0 }, 1)).toBe(0);
  });

  it('is null when the move misses, stops short or moves away', () => {
    expect(sweepDisc({ x: 0, y: 0 }, { x: 20, y: 0 }, 0.15, { x: 10, y: 3 }, 1)).toBeNull();
    expect(sweepDisc({ x: 0, y: 0 }, { x: 5, y: 0 }, 0.15, { x: 10, y: 0 }, 1)).toBeNull();
    expect(sweepDisc({ x: 0, y: 0 }, { x: -20, y: 0 }, 0.15, { x: 10, y: 0 }, 1)).toBeNull();
  });
});
