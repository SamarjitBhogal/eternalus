import { describe, expect, it } from 'vitest';

import { guardOutward } from './guardOutward';

describe('guardOutward', () => {
  it('points from the home centre through the post, into the given vector', () => {
    const out = { x: 0, y: 0 };

    const result = guardOutward({ postX: 60, postY: 30, homeX: 60, homeY: 40 }, out);

    expect(result).toBe(out);
    expect(out).toEqual({ x: 0, y: -10 });
  });
});
