import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { XP_SOURCES } from '../content/progression/xpSources';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';
import { SystemPipeline } from './SystemPipeline';

const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);
const PROGRESSION = { units: UNIT_DEFINITIONS, curves: loadLevelCurves(), xpSources: XP_SOURCES };

describe('DefaultSystemPipeline', () => {
  it('moves, then removes the dead, then checks invariants, in that order', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger),
      state,
      PROGRESSION,
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
    const runner = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const victim = factory.create('light-mob', 'training-dummy', {
      position: { x: 5, y: 5 },
      team: 'dark',
    });
    state.entities.add(runner);
    state.entities.add(victim);
    runner.getComponent(Movement).steer({ x: 1, y: 0 });
    new DamagePipeline().apply(state, victim.id, 1000, {
      attackerId: runner.id,
      kind: 'weapon',
      definitionId: 'warrior',
    });

    pipeline.run({ state, logger });

    expect(pipeline).toBeInstanceOf(SystemPipeline);
    expect(runner.getComponent(Movement).speed).toBeGreaterThan(0);
    expect(state.entities.has(victim.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('lands attacks after movement and before death, so a unit killed this tick leaves this tick', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger),
      state,
      PROGRESSION,
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const victim = factory.create('light-mob', 'training-dummy', {
      position: { x: 1, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(victim);
    const health = victim.getComponent(Health);
    health.applyDamage(health.max - 1);
    state.entities.setAttackTarget(warrior.id, victim.id);

    pipeline.run({ state, logger });

    expect(state.entities.has(victim.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('pays a combat kill in the same tick, before the dead are removed', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger),
      state,
      PROGRESSION,
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const minion = factory.create('light-mob', 'light-minion', {
      position: { x: 1, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(minion);
    const health = minion.getComponent(Health);
    health.applyDamage(health.max - 1);
    state.entities.setAttackTarget(warrior.id, minion.id);

    pipeline.run({ state, logger });

    expect(warrior.getComponent(Progression).xp).toBe(20);
    expect(state.entities.has(minion.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('pays a killer that also died this tick, so progression runs before death', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger),
      state,
      PROGRESSION,
    );
    const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
    const warrior = factory.create('warrior', 'warrior', {
      position: { x: 0, y: 0 },
      team: 'light',
    });
    const minion = factory.create('light-mob', 'light-minion', {
      position: { x: 5, y: 0 },
      team: 'dark',
    });
    state.entities.add(warrior);
    state.entities.add(minion);
    const damage = new DamagePipeline();
    damage.apply(state, minion.id, 1_000_000, {
      attackerId: warrior.id,
      kind: 'weapon',
      definitionId: 'warrior',
    });
    damage.apply(state, warrior.id, 1_000_000, {
      attackerId: minion.id,
      kind: 'weapon',
      definitionId: 'light-minion',
    });

    pipeline.run({ state, logger });

    const awards = state.events
      .recentEvents()
      .filter((event) => event.type === 'xp-gained')
      .map((event) => event.payload);
    expect(awards).toEqual([
      { entityId: warrior.id, amount: 20, victimId: minion.id, victimTeam: 'dark' },
    ]);
    expect(state.entities.has(warrior.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });
});
