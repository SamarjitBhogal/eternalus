import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadZoneLevelUp } from './loadZoneLevelUp';
import { ZONE_LEVEL_UP } from './zoneLevelUp';

describe('loadZoneLevelUp', () => {
  it('converts the hold time from seconds to ticks at load and keeps the levels', () => {
    expect(loadZoneLevelUp(30)).toEqual({
      holdTicks: ZONE_LEVEL_UP.holdSeconds * 30,
      levels: ZONE_LEVEL_UP.levels,
    });
    expect(loadZoneLevelUp(30, { holdSeconds: 0, levels: 1 }).holdTicks).toBe(1);
  });

  it('rejects a hold time that is negative or not finite', () => {
    for (const holdSeconds of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => loadZoneLevelUp(30, { holdSeconds, levels: 1 })).toThrow(ContentValidationError);
    }
  });

  it('rejects levels that are not a positive whole number', () => {
    for (const levels of [0, -1, 1.5, Number.NaN]) {
      expect(() => loadZoneLevelUp(30, { holdSeconds: 90, levels })).toThrow(
        ContentValidationError,
      );
    }
  });
});
