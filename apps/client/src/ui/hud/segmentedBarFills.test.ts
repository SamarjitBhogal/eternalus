import { describe, expect, it } from 'vitest';

import { segmentedBarFills } from './segmentedBarFills';

const states = (fraction: number | null) =>
  segmentedBarFills(fraction, 3).map(({ state, percent }) => `${state}:${String(percent)}`);

describe('segmentedBarFills', () => {
  it.each([
    [0, ['empty:0', 'empty:0', 'empty:0']],
    [1 / 3, ['full:100', 'empty:0', 'empty:0']],
    [0.5, ['full:100', 'leading:50', 'empty:0']],
    [5 / 6, ['full:100', 'full:100', 'leading:50']],
    [1850 / 2220, ['full:100', 'full:100', 'leading:50']],
    [1, ['full:100', 'full:100', 'full:100']],
    [-1, ['empty:0', 'empty:0', 'empty:0']],
    [2, ['full:100', 'full:100', 'full:100']],
  ])('fills %s as %j', (fraction, expected) => {
    expect(states(fraction)).toEqual(expected);
  });

  it('hatches every segment for null and for a non-finite value', () => {
    expect(states(null)).toEqual(['no-data:0', 'no-data:0', 'no-data:0']);
    expect(states(Number.NaN)).toEqual(['no-data:0', 'no-data:0', 'no-data:0']);
  });

  it('follows the tier count', () => {
    expect(segmentedBarFills(0.5, 4).map((fill) => fill.state)).toEqual([
      'full',
      'full',
      'empty',
      'empty',
    ]);
  });
});
