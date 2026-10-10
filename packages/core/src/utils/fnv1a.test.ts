import { describe, expect, it } from 'vitest';

import { fnv1a } from './fnv1a';

describe('fnv1a', () => {
  it.each([
    ['', 0x811c9dc5],
    ['a', 0xe40c292c],
    ['foobar', 0xbf9cf968],
  ])('matches the reference FNV-1a 32-bit vector for %j', (text, expected) => {
    expect(fnv1a(text)).toBe(expected);
  });

  it('returns an unsigned 32-bit integer that changes with one character', () => {
    const hash = fnv1a('tick:1');
    expect(Number.isInteger(hash) && hash >= 0 && hash <= 0xffff_ffff).toBe(true);
    expect(fnv1a('tick:2')).not.toBe(hash);
  });
});
