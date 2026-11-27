import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { Entity } from './Entity';
import { isCollisionMover } from './isCollisionMover';

/** A test entity with only the components it is given. */
class Body extends Entity {
  public readonly kind = 'body';
  public readonly family = 'test';

  protected installComponents(): void {
    // The test adds each component itself.
  }
}

/** A body with a mover and a collider on `layer`, static or not, plus `extra` components. */
const body = (
  layer: 'unit' | 'projectile' = 'unit',
  isStatic = false,
  ...extra: object[]
): Body => {
  const entity = new Body('body-1', 'body');
  entity.addComponent(new Movement({ maxSpeed: 2, acceleration: 0.5, mass: 1 }));
  entity.addComponent(new Collider({ kind: 'circle', radius: 0.5 }, layer, isStatic));
  extra.forEach((component) => {
    entity.addComponent(component);
  });
  return entity;
};

describe('isCollisionMover', () => {
  it('holds for a mover with an enabled, non-static unit collider', () => {
    expect(isCollisionMover(body())).toBe(true);
  });

  it('fails for a shot, a static body, a disabled collider, a deploying mob and a body that does not move', () => {
    const disabled = body();
    disabled.findComponent(Collider)?.disable();
    const still = new Body('body-2', 'body');
    still.addComponent(new Collider({ kind: 'circle', radius: 0.5 }, 'unit'));

    expect(isCollisionMover(body('projectile'))).toBe(false);
    expect(isCollisionMover(body('unit', true))).toBe(false);
    expect(isCollisionMover(disabled)).toBe(false);
    expect(isCollisionMover(body('unit', false, new Deploying({ x: 0, y: 0 })))).toBe(false);
    expect(isCollisionMover(still)).toBe(false);
  });
});
