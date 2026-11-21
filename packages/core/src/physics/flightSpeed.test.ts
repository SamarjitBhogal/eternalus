import { describe, expect, it } from 'vitest';

import { flightSpeed } from './flightSpeed';

describe('flightSpeed', () => {
  it('keeps top speed before the slow zone', () => {
    expect(flightSpeed(2, 0, 100, 80)).toBe(2);
    expect(flightSpeed(2, 79.9, 100, 80)).toBe(2);
  });

  it('eases to the square root of the share of the slow zone left', () => {
    // Half of a 20 m zone left: 2 * sqrt(0.5).
    expect(flightSpeed(2, 90, 100, 80)).toBeCloseTo(Math.sqrt(2));
    // A quarter left: half speed.
    expect(flightSpeed(2, 95, 100, 80)).toBeCloseTo(1);
  });

  it('never goes past the distance left, so the last move lands on range', () => {
    // Slow-zone speed here would be 2 * sqrt(0.1 / 20) = 0.14, more than the 0.1 m left.
    expect(flightSpeed(2, 99.9, 100, 80)).toBeCloseTo(0.1);
    expect(flightSpeed(2, 99, 100, 100)).toBe(1);
  });

  it('flies at full speed to the end when slowFrom equals range', () => {
    expect(flightSpeed(2, 50, 100, 100)).toBe(2);
  });

  it('is zero at or past the range', () => {
    expect(flightSpeed(2, 100, 100, 80)).toBe(0);
    expect(flightSpeed(2, 120, 100, 80)).toBe(0);
  });
});
