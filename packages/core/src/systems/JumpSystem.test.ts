import { describe, expect, it } from 'vitest';

import { Jump } from '../components/Jump';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { JumpSystem } from './JumpSystem';
import type { SystemContext } from './System.types';

const ARC = { airTicks: 3, peakHeight: 1 };
const { tickRate } = createDefaultGameConfig();

const setUp = (): { context: SystemContext; dummy: Entity; jump: Jump } => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(tickRate));
  const dummy = factory.create('light-mob', 'training-dummy', {
    position: { x: 0, y: 0 },
    team: 'neutral',
  });
  const jump = new Jump();
  dummy.addComponent(jump);
  state.entities.add(dummy);
  return { context: { state, logger: new NullLogger() }, dummy, jump };
};

describe('JumpSystem', () => {
  it('lifts a held entity on the ground with the velocity it moves with', () => {
    const { context, dummy, jump } = setUp();
    const movement = dummy.getComponent(Movement);
    movement.steer({ x: 1, y: 0 });
    movement.advance();
    jump.hold(true);

    new JumpSystem(ARC).update(context);

    expect(jump.isAirborne).toBe(true);
    expect(jump.velocity).toEqual(movement.velocity);
    expect(jump.velocity.x).toBeGreaterThan(0);
  });

  it('does not lift an entity whose key is released', () => {
    const { context, jump } = setUp();

    new JumpSystem(ARC).update(context);

    expect(jump.isAirborne).toBe(false);
  });

  it('flies the arc and jumps again on the landing tick while the key stays held', () => {
    const { context, jump } = setUp();
    const system = new JumpSystem(ARC);
    jump.hold(true);
    system.update(context);
    const airborne: boolean[] = [];
    const heights: number[] = [];

    for (let tick = 0; tick < ARC.airTicks; tick += 1) {
      system.update(context);
      airborne.push(jump.isAirborne);
      heights.push(jump.height);
    }

    // Ticks 1 and 2 are in the air; tick 3 lands and takes off again at height 0.
    expect(airborne).toEqual([true, true, true]);
    expect(heights[0]).toBeGreaterThan(0);
    expect(heights[2]).toBe(0);
    expect(jump.fields[1]).toBe(0);
  });

  it('lands and stays down once the key is released', () => {
    const { context, jump } = setUp();
    const system = new JumpSystem(ARC);
    jump.hold(true);
    system.update(context);
    jump.hold(false);

    for (let tick = 0; tick < ARC.airTicks; tick += 1) {
      system.update(context);
    }

    expect(jump.isAirborne).toBe(false);
    expect(jump.height).toBe(0);
  });

  it('lifts nothing while the match holds units idle (the countdown, DEC-88)', () => {
    const { context, jump } = setUp();
    context.state.match.holdIdle(true);
    jump.hold(true);

    new JumpSystem(ARC).update(context);

    expect(jump.isAirborne).toBe(false);
  });

  it('lifts nothing while a status holds the entity in place (cannot-move)', () => {
    const { context, dummy, jump } = setUp();
    const stun = loadStatusEffects(tickRate, 1).get('stun');
    dummy.getComponent(StatusEffects).apply(stun, null, 0);
    jump.hold(true);

    new JumpSystem(ARC).update(context);

    expect(jump.isAirborne).toBe(false);
  });
});
