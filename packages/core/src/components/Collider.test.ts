import { describe, expect, it } from 'vitest';

import { Collider } from './Collider';

describe('Collider', () => {
  it('is a solid, movable circle on its layer by default', () => {
    const collider = new Collider({ kind: 'circle', radius: 0.5 }, 'unit');

    expect(collider.shape).toEqual({ kind: 'circle', radius: 0.5 });
    expect(collider.layer).toBe('unit');
    expect(collider.isStatic).toBe(false);
    expect(collider.isEnabled).toBe(true);
  });

  it('can be taken out of collisions and put back', () => {
    const collider = new Collider({ kind: 'circle', radius: 1 }, 'unit');

    collider.disable();
    expect(collider.isEnabled).toBe(false);
    collider.enable();
    expect(collider.isEnabled).toBe(true);
  });

  it('gives the box around the circle at a centre', () => {
    const collider = new Collider({ kind: 'circle', radius: 2 }, 'structure', true);

    expect(collider.bounds({ x: 10, y: 5 })).toEqual({ x: 8, y: 3, width: 4, height: 4 });
    expect(collider.isStatic).toBe(true);
  });

  it('rejects a radius that is not positive', () => {
    expect(() => new Collider({ kind: 'circle', radius: 0 }, 'unit')).toThrow(
      'radius must be a positive number',
    );
    expect(() => new Collider({ kind: 'circle', radius: Number.NaN }, 'unit')).toThrow('radius');
  });
});
