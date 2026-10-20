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

  it('flags a NaN position and an infinite velocity (injected)', () => {
    const { state, runner } = setUp();
    Reflect.set(runner.getComponent(Transform).position, 'x', Number.NaN);
    Reflect.set(runner.getComponent(Movement).velocity, 'y', Number.POSITIVE_INFINITY);

    const violations = new FiniteTransformsInvariant().check(state);

    expect(violations.map((v) => v.message)).toEqual([
      'Entity "entity-1" has a non-finite position (NaN, 1).',
      'Entity "entity-1" has a non-finite velocity (0, Infinity).',
    ]);
    expect(violations.every((v) => v.severity === 'fatal')).toBe(true);
  });

  it('flags a velocity longer than maxSpeed, and allows float rounding at the limit', () => {
    const { state, runner } = setUp();
    const velocity = runner.getComponent(Movement).velocity;

    Reflect.set(velocity, 'x', 2 * (1 + 1e-12));
    expect(new FiniteTransformsInvariant().check(state)).toEqual([]);

    Reflect.set(velocity, 'x', 1.5);
    Reflect.set(velocity, 'y', 1.5);
    expect(new FiniteTransformsInvariant().check(state).map((v) => v.message)).toEqual([
      'Entity "entity-1" has a velocity above maxSpeed (1.5, 1.5).',
    ]);
  });
});
