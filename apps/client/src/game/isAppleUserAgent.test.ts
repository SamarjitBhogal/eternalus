import { describe, expect, it } from 'vitest';

import { isAppleUserAgent } from './isAppleUserAgent';

describe('isAppleUserAgent (DEC-118)', () => {
  it.each([
    ['a Mac', 'Macintosh; Intel Mac OS X 10_15_7', true],
    ['an iPad', 'iPad; CPU OS 17_0 like Mac OS X', true],
    ['an iPhone', 'iPhone; CPU iPhone OS 17_0 like Mac OS X', true],
    ['Windows', 'Windows NT 10.0; Win64; x64', false],
    ['Linux', 'X11; Linux x86_64', false],
  ])('tells whether %s is an Apple device', (_platform, system, isApple) => {
    expect(isAppleUserAgent(`Mozilla/5.0 (${system}) AppleWebKit/537.36`)).toBe(isApple);
  });
});
