import { describe, expect, it } from 'vitest';

import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { Entity } from '../../entities/Entity';
import { GameState } from '../../state/GameState';
import { FiniteTransformsInvariant } from './FiniteTransformsInvariant';

class Runner extends Entity {
  public readonly kind = 'runner';
  public readonly family = 'test';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 1, y: 1 }, 0.5));
    this.addComponent(new Movement({ maxSpeed: 2, acceleration: 1, mass: 1 }));
  }
}

const setUp = (): { state: GameState; runner: Runner } => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const runner = new Runner('entity-1', 'runner');
  runner.spawn({});
  state.entities.add(runner);
  return { state, runner };
};

describe('FiniteTransformsInvariant', () => {
  it('holds while positions and velocities are finite and speeds within maxSpeed', () => {
    const { state, runner } = setUp();
    runner.getComponent(Movement).accelerateToward({ x: 1, y: 0 });

    expect(new FiniteTransformsInvariant().check(state)).toEqual([]);
  });

  it('flags a NaN position, an infinite velocity and a speed above maxSpeed (injected)', () => {
    const { state, runner } = setUp();
    Reflect.set(runner.getComponent(Transform).position, 'x', Number.NaN);
    const movement = runner.getComponent(Movement);
    Reflect.set(movement.velocity, 'y', Number.POSITIVE_INFINITY);
    Reflect.set(movement, 'currentSpeed', 5);

    const violations = new FiniteTransformsInvariant().check(state);

    expect(violations.map((v) => v.message)).toEqual([
      'Entity "entity-1" has a non-finite position (NaN, 1).',
      'Entity "entity-1" has a non-finite velocity (0, Infinity).',
      'Entity "entity-1" moves at 5, above its maxSpeed 2.',
    ]);
    expect(violations.every((v) => v.severity === 'fatal')).toBe(true);
  });
});
