import { describe, expect, it } from 'vitest';
import { timelineMarkTick } from './timelineMarkTick';

/** 30 ticks per second, 1800 s planned, the countdown ends at tick 300. */
const FRAME = { tickRate: 30, plannedMatchSeconds: 1800, countdownEndTick: 300 };

describe('timelineMarkTick', () => {
  it('keeps an atTick mark absolute, whatever the countdown (DEC-282)', () => {
    expect(timelineMarkTick({ atTick: 300 }, FRAME)).toBe(300);
    expect(timelineMarkTick({ atTick: 0 }, FRAME)).toBe(0);
  });

  it("resolves an atFraction mark from the countdown's end, not from tick 0 (DEC-282)", () => {
    expect(timelineMarkTick({ atFraction: 0 }, FRAME)).toBe(300);
    expect(timelineMarkTick({ atFraction: 0.25 }, FRAME)).toBe(13_800);
    expect(timelineMarkTick({ atFraction: 0.5 }, FRAME)).toBe(27_300);
    expect(timelineMarkTick({ atFraction: 0.75 }, FRAME)).toBe(40_800);
  });

  it('rounds the fraction part to a whole tick, then adds the countdown', () => {
    expect(timelineMarkTick({ atFraction: 0.001 }, FRAME)).toBe(354);
    expect(timelineMarkTick({ atFraction: 0.25 }, { ...FRAME, countdownEndTick: 0 })).toBe(13_500);
  });
});
