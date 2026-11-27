import { describe, expect, it } from 'vitest';

import { SeededRandom } from '../../utils/SeededRandom';
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

  it('picks by seeded weighted chance, never an option scoring 0, and the same for the same seed', () => {
    const rates: Record<string, { near: number }> = {
      a: { near: 1 },
      b: { near: 3 },
      c: { near: 0 },
    };
    const rate = (id: string) => rates[id] ?? { near: 0 };
    const scorer = new UtilityScorer({ near: 1 });
    const draw = (seed: number): string[] => {
      const rng = new SeededRandom(seed);
      return Array.from({ length: 1000 }, () => scorer.pick(['a', 'b', 'c'], rate, rng) ?? 'none');
    };
    const picks = draw(7);
    const shareOf = (id: string): number => picks.filter((pick) => pick === id).length / 1000;

    expect(shareOf('c')).toBe(0);
    expect(shareOf('b')).toBeGreaterThan(0.7);
    expect(shareOf('b')).toBeLessThan(0.8);
    expect(draw(7)).toEqual(picks);
    expect(draw(8)).not.toEqual(picks);
  });

  it('picks the first option when none scores above 0, and nothing from none', () => {
    const rng = new SeededRandom(1);
    const scorer = new UtilityScorer({ near: 1 });

    expect(scorer.pick(['a', 'b'], () => ({ near: 0 }), rng)).toBe('a');
    expect(scorer.pick(['a', 'b'], () => ({ near: -2 }), rng)).toBe('a');
    expect(scorer.pick([], () => ({ near: 1 }), rng)).toBeNull();
  });

  it('never picks an option scoring 0 when the roll is left unspent at the top of the range', () => {
    class TopRandom extends SeededRandom {
      public override nextFloat(): number {
        return 1;
      }
    }
    const scorer = new UtilityScorer({ near: 1 });
    const rate = (id: string) => ({ near: id === 'b' ? 1 : 0 });

    expect(scorer.pick(['a', 'b'], rate, new TopRandom(1))).toBe('b');
  });
});
