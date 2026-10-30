import { describe, expect, it } from 'vitest';

import { canonicalJson } from './canonicalJson';

describe('canonicalJson', () => {
  it('serialises equal objects built in a different key order the same, at every depth', () => {
    const first = { b: 1, a: { d: [1, 2], c: 'x' } };
    const second = { a: { c: 'x', d: [1, 2] }, b: 1 };

    expect(canonicalJson(first)).toBe(canonicalJson(second));
    expect(canonicalJson(second)).toBe('{"a":{"c":"x","d":[1,2]},"b":1}');
  });

  it('keeps array order, sorts objects inside arrays, and drops undefined fields like JSON', () => {
    expect(canonicalJson([{ z: 1, y: undefined, x: 2 }, 3])).toBe('[{"x":2,"z":1},3]');
    expect(canonicalJson([2, 1])).not.toBe(canonicalJson([1, 2]));
  });
});
