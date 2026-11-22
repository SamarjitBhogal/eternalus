import { describe, expect, it } from 'vitest';

import { Footprint } from '../components/Footprint';
import { Transform } from '../components/Transform';
import { Entity } from '../entities/Entity';
import { outlineBoxOf } from './outlineBoxOf';

/** An entity with no components; a test adds the ones it needs. */
class Bare extends Entity {
  public readonly kind = 'bare';
  public readonly family = 'test';

  protected installComponents(): void {
    // Each test adds its own components.
  }
}

const KEEP = [
  { x: 10, y: 20 },
  { x: 18, y: 20 },
  { x: 18, y: 30 },
  { x: 10, y: 30 },
];

describe('outlineBoxOf', () => {
  it('is the Footprint box when the entity has one, wherever its centre is (DEC-323 (3))', () => {
    const tower = new Bare('entity-1', 'buff-tower');
    tower.addComponent(new Transform({ x: 100, y: 100 }, 3));
    tower.addComponent(new Footprint([KEEP]));

    expect(outlineBoxOf(tower)).toEqual({ x: 10, y: 20, width: 8, height: 10 });
  });

  it('is a box of no size at the centre without a Footprint', () => {
    const tower = new Bare('entity-1', 'buff-tower');
    tower.addComponent(new Transform({ x: 7, y: 9 }, 3));

    expect(outlineBoxOf(tower)).toEqual({ x: 7, y: 9, width: 0, height: 0 });
  });

  it('is undefined with neither, so nothing is measured from a made-up place', () => {
    expect(outlineBoxOf(new Bare('entity-1', 'buff-tower'))).toBeUndefined();
  });
});
