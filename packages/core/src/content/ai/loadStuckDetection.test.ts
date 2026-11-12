import { describe, expect, it } from 'vitest';

import { loadStuckDetection } from './loadStuckDetection';
import { STUCK_DETECTION } from './stuckDetection';

describe('loadStuckDetection', () => {
  it('converts the window from seconds to ticks at load and keeps the other fields', () => {
    expect(loadStuckDetection(30)).toEqual({
      windowTicks: 60,
      minProgress: STUCK_DETECTION.minProgress,
      waypointRadius: STUCK_DETECTION.waypointRadius,
      maxPlansPerTick: STUCK_DETECTION.maxPlansPerTick,
    });
    expect(loadStuckDetection(10).windowTicks).toBe(20);
  });

  it('rounds to the nearest tick with no one-tick floor', () => {
    expect(loadStuckDetection(30, { ...STUCK_DETECTION, windowSeconds: 0.51 }).windowTicks).toBe(
      15,
    );
    expect(loadStuckDetection(30, { ...STUCK_DETECTION, windowSeconds: 0 }).windowTicks).toBe(0);
  });
});
