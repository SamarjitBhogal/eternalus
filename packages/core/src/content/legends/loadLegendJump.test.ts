import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { LEGEND_JUMP } from './legendJump';
import { loadLegendJump } from './loadLegendJump';

describe('loadLegendJump', () => {
  it('converts the air time to ticks and keeps the peak height', () => {
    expect(loadLegendJump(30, { airSeconds: 0.6, peakHeight: 1.5 })).toEqual({
      airTicks: 18,
      peakHeight: 1.5,
    });
    expect(loadLegendJump(10, { airSeconds: 0.6, peakHeight: 2 })).toEqual({
      airTicks: 6,
      peakHeight: 2,
    });
  });

  it('loads the shipped record by default', () => {
    expect(loadLegendJump(30)).toEqual(loadLegendJump(30, LEGEND_JUMP));
  });

  it('never loads an air time below one tick', () => {
    expect(loadLegendJump(30, { airSeconds: 0, peakHeight: 1 }).airTicks).toBe(1);
  });

  it.each([
    ['airSeconds', { airSeconds: -0.1, peakHeight: 1 }, /airSeconds is -0\.1 s/],
    ['airSeconds', { airSeconds: Number.NaN, peakHeight: 1 }, /airSeconds/],
    ['peakHeight', { airSeconds: 0.6, peakHeight: -1 }, /peakHeight is -1 m/],
    ['peakHeight', { airSeconds: 0.6, peakHeight: Number.POSITIVE_INFINITY }, /peakHeight/],
  ])('rejects a negative or non-finite %s', (_field, authored, message) => {
    expect(() => loadLegendJump(30, authored)).toThrow(ContentValidationError);
    expect(() => loadLegendJump(30, authored)).toThrow(message);
  });
});
