import { describe, expect, it } from 'vitest';

import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';

import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Progression } from '../components/Progression';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { XP_SOURCES } from '../content/progression/xpSources';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';
import { SystemPipeline } from './SystemPipeline';

const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);

describe('DefaultSystemPipeline', () => {
  it('moves, then removes the dead, then checks invariants, in that order', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger),
      state,
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
    victim.getComponent(Health).applyDamage(1000);

    pipeline.run({ state, logger });

    expect(pipeline).toBeInstanceOf(SystemPipeline);
    expect(runner.getComponent(Movement).speed).toBeGreaterThan(0);
    expect(state.entities.has(victim.id)).toBe(false);
    expect(logger.records).toEqual([]);
  });

  it('awards kill XP before the dead are removed', () => {
    const logger = new MemoryLogger();
    const state = new GameState(createDefaultGameConfig(), 1);
    const pipeline = new DefaultSystemPipeline(
      new DefaultInvariantRunner(TEST_DEBUG_CONFIG, logger),
      state,
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
    victim.getComponent(Health).applyDamage(1000);
    state.events.emit('entity-died', {
      entityId: victim.id,
      killer: { attackerId: warrior.id, kind: 'weapon', definitionId: 'warrior' },
    });

    pipeline.run({ state, logger });

    expect(warrior.getComponent(Progression).xp).toBe(XP_SOURCES.mobKill['light-mob']);
    expect(state.entities.has(victim.id)).toBe(false);
  });
});
