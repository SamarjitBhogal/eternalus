import { describe, expect, it } from 'vitest';
import { loadAbilities } from '../content/abilities/loadAbilities';

import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { ULTIMATE_CHARGE } from '../content/progression/ultimateCharge';
import { XP_SOURCES } from '../content/progression/xpSources';
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
import { loadWeapons } from '../content/weapons/loadWeapons';

const CONFIG = createDefaultGameConfig();
const statusSystem = (state: GameState, applier: StatusEffectApplier) =>
  new StatusEffectSystem(state, new DamagePipeline(), applier);
const STRUCTURES_PER_LANE = CONFIG.map.spawnTowersPerLane + CONFIG.map.buffTowersPerLane;

/** A Warrior (light) at the origin next to a dark training dummy, an applier and an event log. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
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
  const pipeline = new DefaultSystemPipeline({
    invariants: new DefaultInvariantRunner({
      debug: RELEASE_DEBUG_CONFIG,
      logger: new NullLogger(),
      abilities: loadAbilities(30),
      curves: loadLevelCurves(),
      phaseOrder: MATCH_PHASES,
      terminalPhases: TERMINAL_MATCH_PHASES,
    }),
    state,
    progression: {
      units: loadDefaultContent(CONFIG.tickRate),
      curves: loadLevelCurves(),
      xpSources: XP_SOURCES,
      ultimateCharge: ULTIMATE_CHARGE,
    },
    // Statuses are the subject here, not the match: no director moves the phase.
    director: { update: () => undefined },
  });
  return {
    name: 'tick',
    update: (context) => {
      pipeline.run(context);
    },
  };
};

describe('StatusEffectSystem', () => {
  it('ticks bleed once per second per stack, credited to the source, then expires it on the exact tick', () => {
    const { state, applier, dummy, warrior, apply, events, run, ticksOf } = setUp();
    apply(dummy, 'bleed');
    apply(dummy, 'bleed'); // 2 stacks, 12 per tick, 4 ticks over 4 s

    run(statusSystem(state, applier), 121);

    expect(ticksOf('damage-applied')).toEqual([30, 60, 90, 120]);
    expect(events.find((event) => event.type === 'damage-applied')?.payload).toMatchObject({
      amount: 12,
      source: { attackerId: warrior.id, kind: 'status', definitionId: 'bleed' },
    });
    expect(ticksOf('status-expired')).toEqual([120]);
    expect(dummy.getComponent(StatusEffects).active).toHaveLength(0);
  });

  it('a bleed reapplied faster than once a second still ticks every second', () => {
    const { state, applier, dummy, apply, run, ticksOf } = setUp();

    run(statusSystem(state, applier), 61, (tick) => {
      if (tick % 21 === 0) {
        apply(dummy, 'bleed'); // Warrior pace, 0.7 s
      }
    });

    expect(ticksOf('damage-applied')).toEqual([30, 60]);
  });

  it('crushed deals 3% of max health per second', () => {
    const { state, applier, dummy, apply, run } = setUp();
    const health = dummy.getComponent(Health);
    apply(dummy, 'crushed');

    run(statusSystem(state, applier), 31);

    expect(health.current).toBeCloseTo(health.max * 0.97);
  });

  it('gives the same hash for the same statuses, and a different one when only the rhythm differs (determinism)', () => {
    const hashAfter = (reapplyAt: number | null): number => {
      const { applier, state, dummy, apply, run } = setUp();
      run(statusSystem(state, applier), 15, (tick) => {
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

describe('StatusEffectSystem: statuses that end on a hit (Veil, DEC-267, DEC-327)', () => {
  const HIT = { kind: 'weapon', definitionId: 'test-hit' } as const;
  const isVeiled = (entity: Entity): boolean =>
    entity
      .getComponent(StatusEffects)
      .active.some(({ definition }) => definition.id === 'invisible');

  it('a hit taken ends Veil in the next pass, with status-expired and nothing else', () => {
    const { state, applier, warrior, dummy, apply, run, ticksOf } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');
    apply(warrior, 'fury');

    new DamagePipeline().apply(state, warrior.id, 5, { ...HIT, attackerId: dummy.id });
    expect(isVeiled(warrior)).toBe(true);
    run(system, 1);

    expect(isVeiled(warrior)).toBe(false);
    expect(ticksOf('status-expired')).toEqual([0]);
    expect(
      warrior.getComponent(StatusEffects).active.map(({ definition }) => definition.id),
    ).toEqual(['fury']);
  });

  it('a hit dealt ends the attacker’s Veil', () => {
    const { state, applier, warrior, dummy, apply, run } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');

    new DamagePipeline().apply(state, dummy.id, 5, { ...HIT, attackerId: warrior.id });
    run(system, 1);

    expect(isVeiled(warrior)).toBe(false);
  });

  it('a weapon hit ends Veil on both sides', () => {
    const { state, applier, warrior, dummy, apply, run } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');
    apply(dummy, 'invisible', dummy.id);

    new DamagePipeline().apply(state, dummy.id, 5, { ...HIT, attackerId: warrior.id });
    run(system, 1);

    expect([isVeiled(warrior), isVeiled(dummy)]).toEqual([false, false]);
  });

  it('a bleed applied before Veil ticks on the Veiled holder and the Veil stays (DEC-327)', () => {
    const { state, applier, warrior, dummy, apply, run, ticksOf } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'bleed', dummy.id); // first tick at 30
    apply(warrior, 'invisible');

    run(system, 61);

    expect(ticksOf('damage-applied')).toEqual([30, 60]);
    expect(isVeiled(warrior)).toBe(true);
  });

  it('a bleed tick credited to a Veiled attacker leaves its Veil on (DEC-327)', () => {
    const { state, applier, warrior, dummy, apply, run, ticksOf } = setUp();
    const system = statusSystem(state, applier);
    apply(dummy, 'bleed'); // credited to the warrior; first tick at 30
    apply(warrior, 'invisible');

    run(system, 31);

    expect(ticksOf('damage-applied')).toEqual([30]);
    expect(isVeiled(warrior)).toBe(true);
  });

  it('a debuff from another entity, with no damage, ends Veil on the one struck and on the applier (DEC-327)', () => {
    const { state, applier, warrior, dummy, apply, run, ticksOf } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');
    apply(dummy, 'invisible', dummy.id);

    apply(dummy, 'bleed', warrior.id); // the owner's "bleed only attack"; its first tick is at 30
    run(system, 1);

    expect(ticksOf('damage-applied')).toEqual([]);
    expect([isVeiled(warrior), isVeiled(dummy)]).toEqual([false, false]);
  });

  it('a debuff from no one ends the Veil of the one struck, as damage with no attacker does', () => {
    const { state, applier, warrior, apply, run } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');

    apply(warrior, 'concussion', null);
    run(system, 1);

    expect(isVeiled(warrior)).toBe(false);
  });

  it('a buff from another entity (an ally’s aura) ends no Veil (DEC-327)', () => {
    const { state, applier, warrior, dummy, apply, run } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');
    apply(dummy, 'invisible', dummy.id);

    apply(warrior, 'rallied', dummy.id);
    run(system, 1);

    expect([isVeiled(warrior), isVeiled(dummy)]).toEqual([true, true]);
  });

  it('a status from the holder itself ends no Veil: Veil cast again, or its own debuff (DEC-327)', () => {
    const { state, applier, warrior, apply, run } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');
    run(system, 1);

    apply(warrior, 'invisible');
    run(system, 1);
    expect(isVeiled(warrior)).toBe(true);

    apply(warrior, 'concussion');
    run(system, 1);
    expect(isVeiled(warrior)).toBe(true);
  });

  it('a Veil applied after the hit in the same tick stays on', () => {
    const { state, applier, warrior, dummy, apply, run } = setUp();
    const system = statusSystem(state, applier);
    apply(warrior, 'invisible');

    new DamagePipeline().apply(state, warrior.id, 5, { ...HIT, attackerId: dummy.id });
    applier.remove(state, warrior.id, 'invisible');
    apply(warrior, 'invisible');
    run(system, 1);

    expect(isVeiled(warrior)).toBe(true);
  });

  it('a Veil broken again while the pass ends the first one ends in the next pass', () => {
    const { state, applier, warrior, dummy, apply, run } = setUp();
    const system = statusSystem(state, applier);
    const hit = (): void => {
      new DamagePipeline().apply(state, warrior.id, 5, { ...HIT, attackerId: dummy.id });
    };
    apply(warrior, 'invisible');
    let isFirst = true;
    state.events.on('status-expired', () => {
      if (isFirst) {
        isFirst = false;
        apply(warrior, 'invisible');
        hit();
      }
    });

    hit();
    run(system, 1);
    expect(isVeiled(warrior)).toBe(true);
    run(system, 1);

    expect(isVeiled(warrior)).toBe(false);
  });

  it('runs out after 5 s when nothing hits', () => {
    const { state, applier, warrior, apply, run, ticksOf } = setUp();
    apply(warrior, 'invisible');

    run(statusSystem(state, applier), 151);

    expect(ticksOf('status-expired')).toEqual([150]);
  });

  it('a Veil that runs out ends once, though its status-expired listener hurts the holder', () => {
    const { state, applier, warrior, dummy, apply, run, ticksOf } = setUp();
    apply(warrior, 'invisible');
    state.events.on('status-expired', ({ statusId }) => {
      if (statusId === 'invisible') {
        new DamagePipeline().apply(state, warrior.id, 5, { ...HIT, attackerId: dummy.id });
      }
    });

    run(statusSystem(state, applier), 152);

    expect(ticksOf('status-expired')).toEqual([150]);
  });
});

describe('statuses in the tick', () => {
  it('a stunned unit neither moves nor attacks, and both resume when it expires', () => {
    const { state, warrior, dummy, apply, run } = setUp();
    state.entities.setAttackTarget(warrior.id, dummy.id);
    warrior.getComponent(Movement).steer({ x: 0, y: 1 });
    apply(warrior, 'stun'); // 60 ticks (2 s, DEC-42)
    const pipeline = tickPipeline(state);
    const health = dummy.getComponent(Health);

    run(pipeline, 60);
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

  it('a blinded unit still lands its hits: blind has no hard miss (DEC-42)', () => {
    const { state, warrior, dummy, apply, run, ticksOf } = setUp();
    const { interval } = warrior.getComponent(Combat).attack;
    state.entities.setAttackTarget(warrior.id, dummy.id);
    apply(warrior, 'blind'); // 45 ticks

    run(tickPipeline(state), 2 * interval + 1); // inside the 45 ticks of blind

    expect(ticksOf('damage-applied')).toEqual([0, interval, 2 * interval]);
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
