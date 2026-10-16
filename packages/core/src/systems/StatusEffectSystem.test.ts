import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { TimedEvent } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { StatusEffectSystem } from './StatusEffectSystem';
import type { SystemContext } from './System.types';

const CONFIG = createDefaultGameConfig();

/** A Warrior (light) at the origin next to a dark training dummy, with an applier and a clock. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
  );
  const spawn = (kind: string, definitionId: string, x: number, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const warrior = spawn('warrior', 'warrior', 0, 'light');
  const dummy = spawn('light-mob', 'training-dummy', 1, 'dark');
  const context: SystemContext = { state, logger: new NullLogger() };
  const applier = new StatusEffectApplier(loadStatusEffects(CONFIG.tickRate));
  const apply = (target: Entity, statusId: string, sourceId: string | null = warrior.id) =>
    applier.apply(state, target.id, statusId, sourceId);
  const events: TimedEvent[] = [];
  state.events.on('status-expired', (payload) =>
    events.push({ tick: state.tick, type: 'status-expired', payload }),
  );
  state.events.on('damage-applied', (payload) =>
    events.push({ tick: state.tick, type: 'damage-applied', payload }),
  );
  /** Runs `system` for `ticks` ticks. */
  const run = (system: { update(context: SystemContext): void }, ticks: number) => {
    for (let i = 0; i < ticks; i += 1) {
      system.update(context);
      state.advanceTick();
    }
  };
  return { state, warrior, dummy, apply, events, run };
};

describe('StatusEffectSystem', () => {
  it('emits status-applied with the source when a status lands', () => {
    const { state, dummy, warrior, apply } = setUp();
    const applied: unknown[] = [];
    state.events.on('status-applied', (payload) => applied.push(payload));

    apply(dummy, 'stun');

    expect(applied).toEqual([{ entityId: dummy.id, statusId: 'stun', sourceId: warrior.id }]);
  });

  it('a bleed reapplied faster than once a second still ticks every second', () => {
    const { state, dummy, apply, events } = setUp();
    const system = new StatusEffectSystem();
    for (let tick = 0; tick <= 60; tick += 1) {
      if (tick % 21 === 0) {
        apply(dummy, 'bleed'); // Warrior pace, 0.7 s
      }
      system.update({ state, logger: new NullLogger() });
      state.advanceTick();
    }

    expect(
      events.filter((event) => event.type === 'damage-applied').map((event) => event.tick),
    ).toEqual([30, 60]);
  });

  it('ticks bleed once per second per stack, credited to the source, then expires it on the exact tick', () => {
    const { dummy, warrior, apply, events, run } = setUp();
    expect(apply(dummy, 'bleed')).toBe(true);
    apply(dummy, 'bleed'); // 2 stacks, 12 per tick, 4 ticks over 4 s

    run(new StatusEffectSystem(), 121);

    const hits = events.filter((event) => event.type === 'damage-applied');
    expect(hits.map((event) => event.tick)).toEqual([30, 60, 90, 120]);
    expect(hits[0]?.payload).toMatchObject({
      amount: 12,
      source: { attackerId: warrior.id, kind: 'status', definitionId: 'bleed' },
    });
    expect(events.find((event) => event.type === 'status-expired')?.tick).toBe(120);
    expect(dummy.getComponent(StatusEffects).active).toHaveLength(0);
  });

  it('crushed deals 3% of max health per second', () => {
    const { dummy, apply, run } = setUp();
    const health = dummy.getComponent(Health);
    apply(dummy, 'crushed');

    run(new StatusEffectSystem(), 31);

    expect(health.current).toBeCloseTo(health.max * 0.97);
  });

  it('gives the same hash for the same statuses, and a different one without them (determinism)', () => {
    const hashAfter = (statusId: string | null): number => {
      const { state, dummy, apply, run } = setUp();
      if (statusId !== null) {
        apply(dummy, statusId);
      }
      run(new StatusEffectSystem(), 40);
      return new StateHasher().hash(state);
    };

    expect(hashAfter('bleed')).toBe(hashAfter('bleed'));
    expect(hashAfter('bleed')).not.toBe(hashAfter(null));
  });

  it('does not land on a dead target or on something without StatusEffects', () => {
    const { state, dummy, apply } = setUp();
    dummy.getComponent(Health).applyDamage(1_000_000);

    expect(apply(dummy, 'stun')).toBe(false);
    expect(
      new StatusEffectApplier(loadStatusEffects(30)).apply(state, 'nobody', 'stun', null),
    ).toBe(false);
  });
});

describe('statuses in the tick', () => {
  const pipelineOf = () =>
    new DefaultSystemPipeline(new DefaultInvariantRunner(RELEASE_DEBUG_CONFIG, new NullLogger()));

  it('a stunned unit neither moves nor attacks, and both resume when it expires', () => {
    const { state, warrior, dummy, apply } = setUp();
    const pipeline = pipelineOf();
    const context: SystemContext = { state, logger: new NullLogger() };
    state.entities.setAttackTarget(warrior.id, dummy.id);
    warrior.getComponent(Movement).steer({ x: 0, y: 1 });
    apply(warrior, 'stun'); // 30 ticks

    for (let i = 0; i < 30; i += 1) {
      pipeline.run(context);
      state.advanceTick();
    }
    expect(warrior.getComponent(Transform).position).toEqual({ x: 0, y: 0 });
    expect(dummy.getComponent(Health).current).toBe(dummy.getComponent(Health).max);

    pipeline.run(context);
    expect(warrior.getComponent(Transform).position.y).toBeGreaterThan(0);
    expect(dummy.getComponent(Health).current).toBeLessThan(dummy.getComponent(Health).max);
  });

  it('concussion slows movement and attacks by 30%', () => {
    const { state, warrior, apply } = setUp();
    const pipeline = pipelineOf();
    const context: SystemContext = { state, logger: new NullLogger() };
    const movement = warrior.getComponent(Movement);
    movement.steer({ x: 0, y: 1 });
    apply(warrior, 'concussion');

    for (let i = 0; i < 20; i += 1) {
      pipeline.run(context);
      state.advanceTick();
    }
    expect(movement.speed).toBeCloseTo(movement.maxSpeed * 0.7);
  });

  it('concussion stretches the gap between two hits by 1 / 0.7', () => {
    const { state, warrior, dummy, apply, events } = setUp();
    const pipeline = pipelineOf();
    const context: SystemContext = { state, logger: new NullLogger() };
    const { interval } = warrior.getComponent(Combat).attack;
    state.entities.setAttackTarget(warrior.id, dummy.id);
    apply(warrior, 'concussion');

    for (let i = 0; i < 2 * interval; i += 1) {
      pipeline.run(context);
      state.advanceTick();
    }

    const hitTicks = events
      .filter((event) => event.type === 'damage-applied')
      .map((event) => event.tick);
    expect(hitTicks).toEqual([0, Math.round(interval / 0.7)]);
  });

  it.each([
    ['blind', 0],
    ['enraged', 1.15],
  ])('%s: the first hit deals ×%d damage', (statusId, factor) => {
    const { state, warrior, dummy, apply } = setUp();
    const health = dummy.getComponent(Health);
    const { damage } = warrior.getComponent(Combat).attack;
    state.entities.setAttackTarget(warrior.id, dummy.id);
    apply(warrior, statusId);

    pipelineOf().run({ state, logger: new NullLogger() });

    expect(health.current).toBeCloseTo(health.max - damage * factor);
  });
});
