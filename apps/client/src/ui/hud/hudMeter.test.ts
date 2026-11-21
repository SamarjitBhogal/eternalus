import { describe, expect, it } from 'vitest';

import { fractionOf, meterAttributes, percentOf } from './hudMeter';

describe('meterAttributes', () => {
  it('is a meter with now, min 0, max and an optional spoken value', () => {
    expect(meterAttributes('Health', { now: 83, max: 100, text: '1850 of 2220' })).toEqual({
      role: 'meter',
      'aria-label': 'Health',
      'aria-valuenow': 83,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuetext': '1850 of 2220',
    });
  });

  it('is an image named "<label>: No data yet" with no value attributes for null', () => {
    expect(meterAttributes('Aether', null)).toEqual({
      role: 'img',
      'aria-label': 'Aether: No data yet',
    });
  });
});

describe('fractionOf and percentOf', () => {
  it('divides and clamps to 0..1', () => {
    expect(fractionOf(1850, 2220)).toBeCloseTo(0.8333, 4);
    expect(fractionOf(3000, 2220)).toBe(1);
    expect(fractionOf(-5, 10)).toBe(0);
  });

  it('is null for an unknown value, a non-positive maximum or an infinite result', () => {
    expect(fractionOf(null, 10)).toBeNull();
    expect(fractionOf(5, null)).toBeNull();
    expect(fractionOf(5, 0)).toBeNull();
    expect(fractionOf(Number.POSITIVE_INFINITY, 10)).toBeNull();
  });

  it('rounds a fraction to a whole percentage', () => {
    expect(percentOf(5 / 6)).toBe(83);
    expect(percentOf(0.699)).toBe(70);
  });
});
