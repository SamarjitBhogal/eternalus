import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadScoring } from './loadScoring';
import { SCORING } from './scoring';

describe('loadScoring', () => {
  it('converts the assist window and the held minute to ticks at load and keeps the weights', () => {
    expect(loadScoring(10, { ...SCORING, assistWindowSeconds: 2.04 })).toEqual({
      weights: SCORING.weights,
      assistWindowTicks: 20,
      minuteTicks: 600,
    });
  });

  it('loads the shipped values by default: 30 s and one minute at 30 ticks a second', () => {
    expect(loadScoring(30)).toEqual({
      weights: SCORING.weights,
      assistWindowTicks: 900,
      minuteTicks: 1800,
    });
  });

  it('keeps a window of at least one tick', () => {
    expect(loadScoring(30, { ...SCORING, assistWindowSeconds: 0 }).assistWindowTicks).toBe(1);
  });

  it('rejects an assist window that is negative or not a number, naming it', () => {
    expect(() => loadScoring(30, { ...SCORING, assistWindowSeconds: -1 })).toThrow(
      ContentValidationError,
    );
    expect(() => loadScoring(30, { ...SCORING, assistWindowSeconds: Number.NaN })).toThrow(
      'Invalid scoring: assistWindowSeconds is NaN s',
    );
    expect(() =>
      loadScoring(30, { ...SCORING, assistWindowSeconds: Number.POSITIVE_INFINITY }),
    ).toThrow(ContentValidationError);
  });
});
