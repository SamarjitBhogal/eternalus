import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { RELEASE_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import type { TimedEvent } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import type { Team } from '../teams/teams.types';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';
import { StatusEffectSystem } from './StatusEffectSystem';
import type { System, SystemContext } from './System.types';

const CONFIG = createDefaultGameConfig();
const statusSystem = (applier: StatusEffectApplier) =>
  new StatusEffectSystem(new DamagePipeline(), applier);
const STRUCTURES_PER_LANE = CONFIG.map.spawnTowersPerLane + CONFIG.map.buffTowersPerLane;

/** A Warrior (light) at the origin next to a dark training dummy, an applier and an event log. */
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
  const applier = new StatusEffectApplier(loadStatusEffects(CONFIG.tickRate, STRUCTURES_PER_LANE));
  const apply = (target: Entity, statusId: string, sourceId: string | null = warrior.id) =>
    applier.apply(state, target.id, statusId, sourceId);
  const events: TimedEvent[] = [];
  state.events.on('status-expired', (payload) =>
    events.push({ tick: state.tick, type: 'status-expired', payload }),
  );
  state.events.on('damage-applied', (payload) =>
    events.push({ tick: state.tick, type: 'damage-applied', payload }),
  );
  state.events.on('attack-missed', (payload) =>
    events.push({ tick: state.tick, type: 'attack-missed', payload }),
  );
  /** Runs `system` for `ticks` ticks, calling `before(tick)` first each tick. */
  const run = (system: System, ticks: number, before: (tick: number) => void = () => undefined) => {
    for (let i = 0; i < ticks; i += 1) {
      before(state.tick);
      system.update(context);
      state.advanceTick();
    }
  };
  const ticksOf = (type: TimedEvent['type']) =>
    events.filter((event) => event.type === type).map((event) => event.tick);
  return { state, warrior, dummy, apply, applier, events, run, ticksOf };
};

/** The whole default tick of `state` as one system, so `run` can drive it. */
const tickPipeline = (state: GameState): System => {
  const pipeline = new DefaultSystemPipeline(
    new DefaultInvariantRunner(RELEASE_DEBUG_CONFIG, new NullLogger()),
    state,
  );
  return {
    name: 'tick',
    update: (context) => {
      pipeline.run(context);
    },
  };
};

describe('StatusEffectSystem', () => {
  it('ticks bleed once per second per stack, credited to the source, then expires it on the exact tick', () => {
    const { applier, dummy, warrior, apply, events, run, ticksOf } = setUp();
    apply(dummy, 'bleed');
    apply(dummy, 'bleed'); // 2 stacks, 12 per tick, 4 ticks over 4 s

    run(statusSystem(applier), 121);

    expect(ticksOf('damage-applied')).toEqual([30, 60, 90, 120]);
    expect(events.find((event) => event.type === 'damage-applied')?.payload).toMatchObject({
      amount: 12,
      source: { attackerId: warrior.id, kind: 'status', definitionId: 'bleed' },
    });
    expect(ticksOf('status-expired')).toEqual([120]);
    expect(dummy.getComponent(StatusEffects).active).toHaveLength(0);
  });

  it('a bleed reapplied faster than once a second still ticks every second', () => {
    const { applier, dummy, apply, run, ticksOf } = setUp();

    run(statusSystem(applier), 61, (tick) => {
      if (tick % 21 === 0) {
        apply(dummy, 'bleed'); // Warrior pace, 0.7 s
      }
    });

    expect(ticksOf('damage-applied')).toEqual([30, 60]);
  });

  it('crushed deals 3% of max health per second', () => {
    const { applier, dummy, apply, run } = setUp();
    const health = dummy.getComponent(Health);
    apply(dummy, 'crushed');

    run(statusSystem(applier), 31);

    expect(health.current).toBeCloseTo(health.max * 0.97);
  });

  it('gives the same hash for the same statuses, and a different one when only the rhythm differs (determinism)', () => {
    const hashAfter = (reapplyAt: number | null): number => {
      const { applier, state, dummy, apply, run } = setUp();
      run(statusSystem(applier), 15, (tick) => {
        if (tick === 0 || tick === reapplyAt) {
          apply(dummy, 'crushed');
        }
      });
      return new StateHasher().hash(state);
    };

    expect(hashAfter(10)).toBe(hashAfter(10));
    expect(hashAfter(10)).not.toBe(hashAfter(null));
  });
});

describe('statuses in the tick', () => {
  it('a stunned unit neither moves nor attacks, and both resume when it expires', () => {
    const { state, warrior, dummy, apply, run } = setUp();
    state.entities.setAttackTarget(warrior.id, dummy.id);
    warrior.getComponent(Movement).steer({ x: 0, y: 1 });
    apply(warrior, 'stun'); // 30 ticks
    const pipeline = tickPipeline(state);
    const health = dummy.getComponent(Health);

    run(pipeline, 30);
    expect(warrior.getComponent(Transform).position).toEqual({ x: 0, y: 0 });
    expect(health.current).toBe(health.max);

    run(pipeline, 1);
    expect(warrior.getComponent(Transform).position.y).toBeGreaterThan(0);
    expect(health.current).toBeLessThan(health.max);
  });

  it('concussion slows movement to 70% of top speed', () => {
    const { state, warrior, apply, run } = setUp();
    const movement = warrior.getComponent(Movement);
    movement.steer({ x: 0, y: 1 });
    apply(warrior, 'concussion');

    run(tickPipeline(state), 20);

    expect(movement.speed).toBeCloseTo(movement.maxSpeed * 0.7);
  });

  it('concussion stretches the gap between two hits by 1 / 0.7', () => {
    const { state, warrior, dummy, apply, run, ticksOf } = setUp();
    const { interval } = warrior.getComponent(Combat).attack;
    state.entities.setAttackTarget(warrior.id, dummy.id);
    apply(warrior, 'concussion');

    run(tickPipeline(state), 2 * interval);

    expect(ticksOf('damage-applied')).toEqual([0, Math.round(interval / 0.7)]);
  });

  it('a blinded unit spends its attack on a miss: attack-missed, no damage, cooldown taken', () => {
    const { state, warrior, dummy, apply, run, ticksOf } = setUp();
    const { interval } = warrior.getComponent(Combat).attack;
    state.entities.setAttackTarget(warrior.id, dummy.id);
    apply(warrior, 'blind'); // 45 ticks

    run(tickPipeline(state), 3 * interval + 1);

    expect(ticksOf('attack-missed')).toEqual([0, interval, 2 * interval]); // 45 ticks of blind
    expect(ticksOf('damage-applied')).toEqual([3 * interval]);
  });

  it('an enraged unit hits 15% harder', () => {
    const { state, warrior, dummy, apply, run } = setUp();
    const health = dummy.getComponent(Health);
    const { damage } = warrior.getComponent(Combat).attack;
    state.entities.setAttackTarget(warrior.id, dummy.id);
    apply(warrior, 'enraged');

    run(tickPipeline(state), 1);

    expect(health.current).toBeCloseTo(health.max - damage * 1.15);
  });
});
