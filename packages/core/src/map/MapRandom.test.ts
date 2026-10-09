import { describe, expect, it } from 'vitest';

import { MapRandom } from './MapRandom';

const take = (rng: MapRandom, count: number): number[] =>
  Array.from({ length: count }, () => rng.next());

describe('MapRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(take(new MapRandom(42), 20)).toEqual(take(new MapRandom(42), 20));
  });

  it('gives a different sequence for a different seed', () => {
    expect(take(new MapRandom(42), 20)).not.toEqual(take(new MapRandom(43), 20));
  });

  it('stays inside [0, 1)', () => {
    const values = take(new MapRandom(7), 1000);

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});
