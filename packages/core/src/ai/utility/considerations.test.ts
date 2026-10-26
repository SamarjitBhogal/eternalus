import { describe, expect, it } from 'vitest';

import { closeness, share, weakness } from './considerations';

describe('considerations', () => {
  it('score closeness and weakness from 0 to 1', () => {
    expect(closeness(0, 10)).toBe(1);
    expect(closeness(5, 10)).toBe(0.5);
    expect(closeness(20, 10)).toBe(0);
    expect(closeness(1, 0)).toBe(0);
    expect(weakness(0.25)).toBe(0.75);
    expect(weakness(2)).toBe(0);
  });

  it('scores a share of a maximum from 0 to 1', () => {
    expect(share(1, 4)).toBe(0.25);
    expect(share(5, 4)).toBe(1);
    expect(share(-1, 4)).toBe(0);
    expect(share(1, 0)).toBe(0);
  });
});
