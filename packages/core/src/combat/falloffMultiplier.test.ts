import { describe, expect, it } from 'vitest';
import { falloffMultiplier } from './falloffMultiplier';

const FALLOFF = { fullTo: 10, floorAt: 30, floor: 0.4 };

describe('falloffMultiplier', () => {
  it('is 1 at distance 0 and up to fullTo', () => {
    expect(falloffMultiplier(FALLOFF, 0)).toBe(1);
    expect(falloffMultiplier(FALLOFF, 10)).toBe(1);
  });

  it('falls in a straight line between fullTo and floorAt', () => {
    expect(falloffMultiplier(FALLOFF, 20)).toBeCloseTo(0.7);
  });

  it('is the floor at floorAt and beyond', () => {
    expect(falloffMultiplier(FALLOFF, 30)).toBe(0.4);
    expect(falloffMultiplier(FALLOFF, 500)).toBe(0.4);
  });

  it('is always 1 without fall-off', () => {
    expect(falloffMultiplier(null, 1000)).toBe(1);
  });
});
