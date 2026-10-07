import { describe, expect, it } from 'vitest';

import { SeededRandom } from './SeededRandom';

const draws = (random: SeededRandom, count: number): number[] =>
  Array.from({ length: count }, () => random.nextFloat());

describe('SeededRandom', () => {
  it('produces the known sequence for seed 1', () => {
    const random = new SeededRandom(1);
    expect(draws(random, 5)).toEqual(KNOWN_SEED_1);
  });

  it('gives two generators with one seed the same 10,000 draws', () => {
    expect(draws(new SeededRandom(20261006), 10_000)).toEqual(
      draws(new SeededRandom(20261006), 10_000),
    );
  });

  it('gives neighbouring seeds different sequences', () => {
    expect(draws(new SeededRandom(2), 3)).not.toEqual(draws(new SeededRandom(3), 3));
  });

  it('keeps every float in [0, 1)', () => {
    const values = draws(new SeededRandom(7), 10_000);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('draws whole numbers in an inclusive range and reaches both ends', () => {
    const random = new SeededRandom(11);
    const seen = new Set<number>();
    for (let draw = 0; draw < 1000; draw += 1) {
      seen.add(random.nextInt(-2, 2));
    }
    expect([...seen].sort((left, right) => left - right)).toEqual([-2, -1, 0, 1, 2]);
    expect(random.nextInt(5, 5)).toBe(5);
  });

  it.each<[number, number]>([
    [3, 2],
    [0.5, 2],
    [0, Number.POSITIVE_INFINITY],
    [0, 2 ** 33],
  ])('rejects nextInt(%s, %s)', (min, max) => {
    expect(() => new SeededRandom(1).nextInt(min, max)).toThrow(RangeError);
  });

  it.each([-1, 1.5, 2 ** 32, Number.NaN])('rejects seed %s', (seed) => {
    expect(() => new SeededRandom(seed)).toThrow(RangeError);
  });

  it('accepts the largest seed', () => {
    expect(new SeededRandom(0xffff_ffff).nextFloat()).toBeLessThan(1);
  });

  it('resumes the same sequence from a saved state', () => {
    const random = new SeededRandom(99);
    draws(random, 17);
    const state = random.getState();
    const resumed = SeededRandom.fromState(structuredClone(state));
    expect(draws(resumed, 100)).toEqual(draws(random, 100));
    expect(resumed.getState()).toEqual(random.getState());
  });

  it('rejects a corrupt saved state', () => {
    const { seed } = new SeededRandom(1).getState();
    expect(() => SeededRandom.fromState({ seed, words: [1, 2, 3, -4] })).toThrow(RangeError);
  });

  describe('fork', () => {
    it('derives a stream from the seed and name only, not from earlier draws', () => {
      const fresh = new SeededRandom(5);
      const used = new SeededRandom(5);
      draws(used, 50);
      expect(draws(fresh.fork('setup'), 20)).toEqual(draws(used.fork('setup'), 20));
    });

    it('gives different names independent streams', () => {
      const root = new SeededRandom(5);
      expect(draws(root.fork('setup'), 20)).not.toEqual(draws(root.fork('ai'), 20));
      expect(draws(root.fork('setup'), 20)).not.toEqual(draws(new SeededRandom(5), 20));
    });

    it('draws nothing from the parent stream', () => {
      const forked = new SeededRandom(5);
      const plain = new SeededRandom(5);
      draws(forked.fork('setup'), 30);
      expect(draws(forked, 10)).toEqual(draws(plain, 10));
    });

    it('gives the same name under different seeds different streams', () => {
      expect(draws(new SeededRandom(1).fork('setup'), 5)).not.toEqual(
        draws(new SeededRandom(2).fork('setup'), 5),
      );
    });
  });
});

/**
 * Pinned output of seed 1 (splitmix32 seeding, 12 warm-up draws, sfc32), cross-checked against an
 * independent implementation. Changing it invalidates every recorded replay.
 */
const KNOWN_SEED_1 = [
  0.263228221796453, 0.6034020676743239, 0.7019734452478588, 0.22371549904346466,
  0.6365781899075955,
];
