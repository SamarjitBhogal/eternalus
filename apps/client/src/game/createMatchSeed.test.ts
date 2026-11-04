import { describe, expect, it, vi } from 'vitest';

import { createMatchSeed } from './createMatchSeed';

/** A random source that writes `value` into the array it is given. */
const source = (value: number) => (values: Uint32Array) => {
  values[0] = value;
  return values;
};

describe('createMatchSeed', () => {
  it('returns the source value as a whole number in 0..2^32-1', () => {
    expect(createMatchSeed(source(0))).toBe(0);
    expect(createMatchSeed(source(4_294_967_295))).toBe(4_294_967_295);
    expect(createMatchSeed(source(2 ** 32 + 5))).toBe(5);
  });

  it('asks the source anew for each seed', () => {
    let next = 41;
    const counting = (values: Uint32Array) => source(next++)(values);

    expect([createMatchSeed(counting), createMatchSeed(counting)]).toEqual([41, 42]);
  });

  it('falls back to 0 when the source returns no value', () => {
    expect(createMatchSeed(() => new Uint32Array(0))).toBe(0);
  });

  it('draws from the browser crypto by default', () => {
    const getRandomValues = vi.spyOn(crypto, 'getRandomValues').mockImplementation((values) => {
      if (values instanceof Uint32Array) values[0] = 123_456_789;
      return values;
    });

    try {
      expect(createMatchSeed()).toBe(123_456_789);
      expect(getRandomValues).toHaveBeenCalledOnce();
    } finally {
      getRandomValues.mockRestore();
    }
  });
});
