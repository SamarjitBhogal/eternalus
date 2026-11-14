import { describe, expect, it } from 'vitest';

import { dashReach } from './dashReach';

/** A grid whose only wall is the vertical line x = `wallX`: a line is clear if it stops short of it. */
const wallAt = (wallX: number) => ({
  isLineClear: (fromX: number, _fromY: number, toX: number, _toY: number, maxDistance?: number) => {
    const length = Math.abs(toX - fromX);
    const reached =
      maxDistance === undefined
        ? toX
        : fromX + Math.sign(toX - fromX) * Math.min(maxDistance, length);
    return reached < wallX;
  },
});

const EAST = { x: 1, y: 0 };

describe('dashReach', () => {
  it('is the whole distance when the line is clear', () => {
    expect(dashReach(wallAt(100), { x: 0, y: 0 }, EAST, 8)).toBe(8);
  });

  it('is the whole distance when there is no map', () => {
    expect(dashReach(undefined, { x: 0, y: 0 }, EAST, 8)).toBe(8);
  });

  it('stops at the wall when one is in the way', () => {
    expect(dashReach(wallAt(5), { x: 0, y: 0 }, EAST, 8)).toBeCloseTo(5, 3);
    expect(dashReach(wallAt(5), { x: 0, y: 0 }, EAST, 8)).toBeLessThan(5);
  });

  it('is 0 for a dash that starts against the wall', () => {
    expect(dashReach(wallAt(0.0001), { x: 0, y: 0 }, EAST, 8)).toBeLessThan(0.001);
  });
});
