import { describe, expect, it } from 'vitest';
import { timelineMarkTick } from './timelineMarkTick';

describe('timelineMarkTick', () => {
  it('keeps an atTick mark absolute, whatever the countdown (DEC-282)', () => {
    expect(timelineMarkTick({ atTick: 300 }, 30, 1800, 300)).toBe(300);
    expect(timelineMarkTick({ atTick: 0 }, 30, 1800, 300)).toBe(0);
  });

  it("resolves an atFraction mark from the countdown's end, not from tick 0 (DEC-282)", () => {
    expect(timelineMarkTick({ atFraction: 0 }, 30, 1800, 300)).toBe(300);
    expect(timelineMarkTick({ atFraction: 0.25 }, 30, 1800, 300)).toBe(13_800);
    expect(timelineMarkTick({ atFraction: 0.5 }, 30, 1800, 300)).toBe(27_300);
    expect(timelineMarkTick({ atFraction: 0.75 }, 30, 1800, 300)).toBe(40_800);
  });

  it('rounds the fraction part to a whole tick, then adds the countdown', () => {
    expect(timelineMarkTick({ atFraction: 0.001 }, 30, 1800, 300)).toBe(354);
    expect(timelineMarkTick({ atFraction: 0.25 }, 30, 1800, 0)).toBe(13_500);
  });
});
