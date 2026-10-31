import { describe, expect, it } from 'vitest';

import { UtilityScorer } from './UtilityScorer';

describe('UtilityScorer', () => {
  it('picks the highest weighted sum, keeping the earlier option on a tie', () => {
    const rates: Record<string, { near: number; weak: number }> = {
      a: { near: 1, weak: 0 },
      b: { near: 0, weak: 1 },
      c: { near: 0.5, weak: 0.4 },
    };
    const rate = (id: string) => rates[id] ?? { near: 0, weak: 0 };

    expect(new UtilityScorer({ near: 1, weak: 1 }).best(['a', 'b', 'c'], rate)).toBe('a');
    expect(new UtilityScorer({ near: 1, weak: 2 }).best(['a', 'b', 'c'], rate)).toBe('b');
    expect(new UtilityScorer({ near: 1, weak: 1 }).best([], rate)).toBeNull();
  });
});
