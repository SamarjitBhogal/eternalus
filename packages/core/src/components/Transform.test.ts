import { describe, expect, it } from 'vitest';

import { Transform } from './Transform';

describe('Transform', () => {
  it('starts at the given position and moves by and to points', () => {
    const transform = new Transform({ x: 10, y: 20 }, 0.5);

    transform.moveBy({ x: 5, y: -5 });
    expect(transform.position).toEqual({ x: 15, y: 15 });

    transform.moveTo({ x: 0, y: 0 });
    expect(transform.position).toEqual({ x: 0, y: 0 });
    expect(transform.radius).toBe(0.5);
  });

  it('rejects a radius that is not positive', () => {
    expect(() => new Transform({ x: 0, y: 0 }, 0)).toThrow('radius must be a positive number');
    expect(() => new Transform({ x: 0, y: 0 }, Number.NaN)).toThrow('radius');
  });

  it('never holds a non-finite position', () => {
    const transform = new Transform({ x: 1, y: 1 }, 1);

    expect(() => {
      transform.moveTo({ x: Number.POSITIVE_INFINITY, y: 0 });
    }).toThrow('position must be finite');
    expect(() => {
      transform.moveBy({ x: 0, y: Number.NaN });
    }).toThrow('position must be finite');
    expect(transform.position).toEqual({ x: 1, y: 1 });
  });
});
