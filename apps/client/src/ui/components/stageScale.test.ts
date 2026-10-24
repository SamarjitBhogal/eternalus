import { describe, expect, it } from 'vitest';

import { fitStageScale, stageFontSize } from './stageScale';

describe('fitStageScale', () => {
  it.each([
    [1920, 1080, 1],
    [3840, 2160, 2],
    [1920, 1200, 1],
    [2560, 1080, 1],
    [1280, 720, 2 / 3],
    [1366, 768, 768 / 1080],
  ])('fits %i × %i at %f', (width, height, scale) => {
    expect(fitStageScale(width, height)).toBeCloseTo(scale, 12);
  });

  it('letterboxes by the tighter side (1366 × 768 is height-bound: 0.7111…)', () => {
    expect(fitStageScale(1366, 768)).toBeLessThan(1366 / 1920);
    expect(fitStageScale(1366, 768).toFixed(4)).toBe('0.7111');
  });
});

// OD-21e: a fitted panel title keeps the I-51 floor its module rule has (motionTokens.test.ts).
describe('stageFontSize', () => {
  it('writes a runtime size in the I-51 form, floored at --text-min on screen', () => {
    expect(stageFontSize(85)).toBe('max(85px, calc(var(--text-min) / var(--stage-scale)))');
    expect(stageFontSize(64)).toBe('max(64px, calc(var(--text-min) / var(--stage-scale)))');
  });
});
