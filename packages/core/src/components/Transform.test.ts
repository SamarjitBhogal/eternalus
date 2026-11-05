import { describe, expect, it } from 'vitest';

import { Transform } from './Transform';
import { INITIAL_FACING } from './Transform.constants';

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

  it('moves in place instead of allocating a new position', () => {
    const transform = new Transform({ x: 0, y: 0 }, 1);
    const position = transform.position;

    transform.moveBy({ x: 1, y: 2 });

    expect(transform.position).toBe(position);
    expect(position).toEqual({ x: 1, y: 2 });
  });

  it('faces INITIAL_FACING until it turns, then along the direction, as a unit vector', () => {
    const transform = new Transform({ x: 0, y: 0 }, 1);
    expect(transform.facing).toEqual(INITIAL_FACING);

    transform.face({ x: 0, y: -3 });

    expect(transform.facing).toEqual({ x: 0, y: -1 });
  });

  it('keeps its facing when turned along no direction (DEC-192: a still unit keeps it)', () => {
    const transform = new Transform({ x: 0, y: 0 }, 1);
    transform.face({ x: -2, y: 0 });

    transform.face({ x: 0, y: 0 });

    expect(transform.facing).toEqual({ x: -1, y: 0 });
  });

  it('never holds a non-finite facing', () => {
    const transform = new Transform({ x: 0, y: 0 }, 1);

    expect(() => {
      transform.face({ x: Number.NaN, y: 1 });
    }).toThrow('facing direction must be finite');
    expect(transform.facing).toEqual(INITIAL_FACING);
  });

  it('looks at a point as a unit vector, without a new facing object', () => {
    const transform = new Transform({ x: 1, y: 1 }, 1);
    const facing = transform.facing;

    transform.lookAt({ x: 1, y: 11 });

    expect(transform.facing).toBe(facing);
    expect(facing).toEqual({ x: 0, y: 1 });
    transform.lookAt({ x: -2, y: 5 });
    expect(facing.x).toBeCloseTo(-0.6);
    expect(facing.y).toBeCloseTo(0.8);
  });

  it('keeps its facing when it looks at its own position', () => {
    const transform = new Transform({ x: 3, y: 4 }, 1);
    transform.face({ x: 0, y: -1 });

    transform.lookAt({ x: 3, y: 4 });

    expect(transform.facing).toEqual({ x: 0, y: -1 });
  });

  it('never looks at a non-finite point', () => {
    const transform = new Transform({ x: 0, y: 0 }, 1);

    expect(() => {
      transform.lookAt({ x: 1, y: Number.NaN });
    }).toThrow('look-at point must be finite');
    expect(transform.facing).toEqual(INITIAL_FACING);
  });
});
