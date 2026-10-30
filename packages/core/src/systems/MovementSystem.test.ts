import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { MovementSystem } from './MovementSystem';
import type { SystemContext } from './System.types';

const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);

class Statue extends Entity {
  public readonly kind = 'statue';
  public readonly family = 'obstacle';

  protected installComponents(): void {
    this.addComponent(new Transform({ x: 7, y: 7 }, 1));
  }
}

const setUp = (): { context: SystemContext; dummy: Entity } => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 0, y: 0 },
    team: 'neutral',
  });
  state.entities.add(dummy);
  return { context: { state, logger: new NullLogger() }, dummy };
};

describe('MovementSystem', () => {
  it('brings a dummy to maxSpeed after maxSpeed / acceleration ticks, never above', () => {
    const { context, dummy } = setUp();
    const movement = dummy.getComponent(Movement);
    const ticks = Math.ceil(movement.maxSpeed / movement.acceleration);
    movement.steer({ x: 1, y: 0 });
    const system = new MovementSystem();

    for (let tick = 1; tick < ticks; tick += 1) {
      system.update(context);
      expect(movement.speed).toBeLessThan(movement.maxSpeed);
    }
    system.update(context);
    expect(movement.speed).toBe(movement.maxSpeed);
    system.update(context);
    expect(movement.speed).toBe(movement.maxSpeed);
  });

  it('moves the transform by the velocity each tick', () => {
    const { context, dummy } = setUp();
    dummy.getComponent(Movement).steer({ x: 0, y: 1 });

    new MovementSystem().update(context);

    const { acceleration } = dummy.getComponent(Movement);
    expect(dummy.getComponent(Transform).position).toEqual({ x: 0, y: acceleration });
  });

  it('slows down after a stop instead of halting at once', () => {
    const { context, dummy } = setUp();
    const movement = dummy.getComponent(Movement);
    const system = new MovementSystem();
    movement.steer({ x: 1, y: 0 });
    system.update(context);
    system.update(context);
    const fullSpeed = movement.speed;

    movement.steer({ x: 0, y: 0 });
    system.update(context);

    expect(movement.speed).toBeGreaterThan(0);
    expect(movement.speed).toBeLessThan(fullSpeed);
  });

  it('leaves entities without Movement where they are', () => {
    const { context } = setUp();
    const statue = new Statue('statue-1', 'statue');
    statue.spawn({});
    context.state.entities.add(statue);

    new MovementSystem().update(context);

    expect(statue.getComponent(Transform).position).toEqual({ x: 7, y: 7 });
  });

  it('is deterministic: the same steering gives the same positions', () => {
    const run = (): { x: number; y: number } => {
      const { context, dummy } = setUp();
      const system = new MovementSystem();
      for (let tick = 0; tick < 60; tick += 1) {
        dummy.getComponent(Movement).steer(tick < 30 ? { x: 1, y: 2 } : { x: -3, y: 1 });
        system.update(context);
      }
      const { x, y } = dummy.getComponent(Transform).position;
      return { x, y };
    };

    expect(run()).toEqual(run());
  });
  it('holds every entity while the match holds units idle, and lets the kept heading go after', () => {
    const { context, dummy } = setUp();
    const movement = dummy.getComponent(Movement);
    const transform = dummy.getComponent(Transform);
    movement.steer({ x: 1, y: 0 });
    context.state.match.isIdleHeld = true;
    const system = new MovementSystem();

    system.update(context);
    system.update(context);
    expect(movement.speed).toBe(0);
    expect(transform.position).toEqual({ x: 0, y: 0 });

    context.state.match.isIdleHeld = false;
    system.update(context);
    expect(transform.position.x).toBeGreaterThan(0);
  });
});
