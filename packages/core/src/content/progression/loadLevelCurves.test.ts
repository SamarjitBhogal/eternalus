import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadLevelCurves } from './loadLevelCurves';
import type { LevelCurveDefinition } from './progression.types';

const SHORT: LevelCurveDefinition = { id: 'short', cap: 3, xpToNext: [10, 20] };

describe('loadLevelCurves', () => {
  it('ships the legend curve: cap 50 (O6), 49 steps, 2,548 XP to the cap', () => {
    const legend = loadLevelCurves().get('legend');

    expect(legend.cap).toBe(50);
    expect(legend.xpToNext).toHaveLength(49);
    expect(legend.xpToNext.reduce((sum, step) => sum + step, 0)).toBe(2548);
  });

  it('accepts a curve with one positive step per level below the cap', () => {
    expect(loadLevelCurves([SHORT]).get('short')).toEqual(SHORT);
  });

  it.each([
    ['a table shorter than cap - 1', { ...SHORT, xpToNext: [10] }, 'xpToNext needs cap - 1 steps'],
    ['a step that is not positive', { ...SHORT, xpToNext: [10, 0] }, 'steps must be positive'],
    [
      'a cap below 1',
      { ...SHORT, cap: 0, xpToNext: [] },
      'cap must be a whole number of at least 1',
    ],
    ['a fractional cap', { ...SHORT, cap: 2.5 }, 'cap must be a whole number of at least 1'],
  ])('rejects %s', (_, curve, message) => {
    expect(() => loadLevelCurves([curve])).toThrow(ContentValidationError);
    expect(() => loadLevelCurves([curve])).toThrow(`Level curve "short": ${message}.`);
  });
});
