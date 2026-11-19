import { describe, expect, it } from 'vitest';

import { fortInWorld } from './fortInWorld';

describe('fortInWorld', () => {
  it('returns the sketch fort unchanged in a sketch-sized world', () => {
    expect(fortInWorld(32, { width: 1600, height: 900 })).toEqual({
      width: 32,
      height: 32,
      wallWidth: 3.2,
      wallHeight: 3.2,
    });
  });

  it('stretches the side and the wall per axis', () => {
    expect(fortInWorld(32, { width: 3200, height: 900 })).toEqual({
      width: 64,
      height: 32,
      wallWidth: 6.4,
      wallHeight: 3.2,
    });
  });
});
