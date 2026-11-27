import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { CAPTURE_POINT } from './capturePoint';
import { CATHEDRAL_CAPTURE_POINT } from './cathedralCapturePoint';
import { loadZoneLevelUp } from './loadZoneLevelUp';

const withLevelUp = (holdSeconds: number, levels: number) => [
  { ...CAPTURE_POINT, levelUp: { holdSeconds, levels } },
];

describe('loadZoneLevelUp', () => {
  it("loads each zone's own level-up by id, the hold time in ticks (DEC-241, DEC-353 (c))", () => {
    const loaded = loadZoneLevelUp(30);
    for (const zone of [CAPTURE_POINT, CATHEDRAL_CAPTURE_POINT]) {
      expect(loaded.get(zone.id)).toEqual({
        holdTicks: zone.levelUp.holdSeconds * 30,
        levels: zone.levelUp.levels,
      });
    }
    const other = loadZoneLevelUp(30, [
      { ...CAPTURE_POINT, levelUp: { holdSeconds: 10, levels: 2 } },
      CATHEDRAL_CAPTURE_POINT,
    ]);
    expect(other.get(CAPTURE_POINT.id)).toEqual({ holdTicks: 300, levels: 2 });
    expect(loadZoneLevelUp(30, withLevelUp(0, 1)).get(CAPTURE_POINT.id)?.holdTicks).toBe(1);
  });

  it('rejects a hold time that is negative or not finite', () => {
    for (const holdSeconds of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => loadZoneLevelUp(30, withLevelUp(holdSeconds, 1))).toThrow(
        ContentValidationError,
      );
    }
  });

  it('rejects levels that are not a positive whole number', () => {
    for (const levels of [0, -1, 1.5, Number.NaN]) {
      expect(() => loadZoneLevelUp(30, withLevelUp(90, levels))).toThrow(ContentValidationError);
    }
  });
});
