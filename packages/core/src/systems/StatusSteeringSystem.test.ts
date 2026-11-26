import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { StatusSteeringKind } from '../content/status-effects/statusEffects.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import { GameState } from '../state/GameState';
import { MovementSystem } from './MovementSystem';
import { StatusSteeringSystem } from './StatusSteeringSystem';
import type { SystemContext } from './System.types';

const CONFIG = createDefaultGameConfig();

const FEARED = loadStatusEffects(CONFIG.tickRate, 2).get('feared');

/**
 * A dark training dummy at the origin and a light Warrior 3 m east of it, the steering and movement
 * systems, and a way to fear a unit from the Warrior in a given form (`feared` runs from its source
 * or cowers, DEC-203, DEC-382 (R3 D); the applier's draw is tested with the applier).
 */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const spawn = (kind: string, definitionId: string, x: number, team: 'light' | 'dark') => {
    const entity = factory.create(kind, definitionId, { position: { x, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const dummy = spawn('light-mob', 'training-dummy', 0, 'dark');
  const warrior = spawn('warrior', 'warrior', 3, 'light');
  const fear = (entity: Entity, form: StatusSteeringKind) => {
    entity.getComponent(StatusEffects).apply(FEARED, warrior.id, state.tick, undefined, form);
  };
  const context: SystemContext = { state, logger: new NullLogger() };
  const steering = new StatusSteeringSystem(createDefaultStrategyRegistry().steering);
  const movement = new MovementSystem();
  /** One tick of steering then walking. */
  const tick = () => {
    steering.update(context);
    movement.update(context);
  };
  const velocityOf = (entity: Entity) => entity.getComponent(Movement).velocity;
  return { state, spawn, dummy, warrior, fear, tick, velocityOf };
};

describe('StatusSteeringSystem', () => {
  it('runs a feared unit straight away from the source, over its own heading, at half speed', () => {
    const { dummy, fear, tick, velocityOf } = setUp();
    dummy.getComponent(Movement).steer({ x: 1, y: 0 }); // toward the Warrior, as a chase would
    fear(dummy, 'flee-source');

    for (let step = 0; step < 30; step += 1) tick();

    const movement = dummy.getComponent(Movement);
    expect(velocityOf(dummy).x).toBeLessThan(0);
    expect(velocityOf(dummy).y).toBe(0);
    expect(movement.speed).toBeCloseTo(movement.maxSpeed * 0.5);
    // Its own heading waits underneath, for when the fear ends.
    expect(movement.heading).toEqual({ x: 1, y: 0 });
  });

  it('keeps the last heading once the source is gone', () => {
    const { state, dummy, warrior, fear, tick, velocityOf } = setUp();
    dummy.getComponent(Transform).moveBy({ x: 0, y: -4 }); // 3 m west and 4 m south of the Warrior
    fear(dummy, 'flee-source');
    tick();

    state.entities.remove(warrior.id, 'dev-removed');
    for (let step = 0; step < 10; step += 1) tick();

    const now = velocityOf(dummy);
    const speed = Math.hypot(now.x, now.y);
    expect(now.x / speed).toBeCloseTo(-0.6);
    expect(now.y / speed).toBeCloseTo(-0.8);
    expect(dummy.findComponent(StatusEffects)?.steering?.heading).toEqual({ x: -0.6, y: -0.8 });
  });

  it('stands a cowering unit: it slows to a stop over its own heading, while a fleeing one runs (R3 D)', () => {
    const { spawn, dummy, fear, tick, velocityOf } = setUp();
    const runner = spawn('light-mob', 'training-dummy', 0, 'dark');
    for (const unit of [dummy, runner]) unit.getComponent(Movement).steer({ x: 0, y: 1 });
    for (let step = 0; step < 10; step += 1) tick(); // both walk north
    const walking = dummy.getComponent(Movement).speed;
    const at = { ...dummy.getComponent(Transform).position };

    fear(dummy, 'cower');
    fear(runner, 'flee-source');
    tick();
    const slowed = dummy.getComponent(Movement).speed;
    for (let step = 0; step < 30; step += 1) tick();
    const stopped = { ...dummy.getComponent(Transform).position };
    tick();

    expect(slowed).toBeGreaterThan(0);
    expect(slowed).toBeLessThan(walking);
    expect(velocityOf(dummy)).toEqual({ x: 0, y: 0 });
    expect(dummy.getComponent(Transform).position).toEqual(stopped);
    expect(stopped.y - at.y).toBeLessThan(1);
    expect(dummy.getComponent(Movement).heading).toEqual({ x: 0, y: 1 }); // waits underneath
    expect(velocityOf(runner).x).toBeLessThan(0);
  });

  it('steers nothing without a steering status, and leaves the own heading to walk by', () => {
    const { dummy, tick, velocityOf } = setUp();
    dummy.getComponent(Movement).steer({ x: 0, y: 1 });

    tick();

    expect(velocityOf(dummy).x).toBe(0);
    expect(velocityOf(dummy).y).toBeGreaterThan(0);
  });
});
