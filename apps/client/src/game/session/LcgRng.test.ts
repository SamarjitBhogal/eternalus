import { describe, expect, it } from 'vitest';

import { LcgRng } from './LcgRng';

const draws = (seed: number, count: number, max: number) => {
  const rng = new LcgRng(seed);
  return Array.from({ length: count }, () => rng.nextInt(max));
};

describe('LcgRng', () => {
  it('repeats its stream for the same seed and differs for another', () => {
    expect(draws(123, 50, 1000)).toEqual(draws(123, 50, 1000));
    expect(draws(123, 50, 1000)).not.toEqual(draws(124, 50, 1000));
  });

  it('stays in [0, max) and reaches both ends of a small range', () => {
    const values = draws(9, 1000, 3);
    expect(values.every((v) => Number.isInteger(v) && v >= 0 && v < 3)).toBe(true);
    expect(new Set(values)).toEqual(new Set([0, 1, 2]));
  });

  it('matches the known first draw for seed 1', () => {
    // fmix32(1) → LCG step → 2071916202; 2071916202 / 2^32 * 1000 → 482.
    expect(draws(1, 1, 1000)).toEqual([482]);
  });

  it('gives unrelated first draws for consecutive seeds', () => {
    // Regression: without seed mixing, seeds 7…26 all drew 0 from nextInt(2) (same team).
    const firstDraws = Array.from({ length: 20 }, (_, i) => draws(7 + i, 1, 2)[0]);
    expect(new Set(firstDraws)).toEqual(new Set([0, 1]));
  });
});
