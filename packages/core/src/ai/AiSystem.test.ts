import { describe, expect, it } from 'vitest';

import type { Command } from '../commands/Command.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { AiCadence } from '../content/ai/ai.types';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { LIGHT_MINION } from '../content/mobs/lightMinion';
import type { UnitDefinition } from '../content/units/units.types';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { EntityId } from '../state/EntityStore.types';
import { GameState } from '../state/GameState';
import { fnv1a } from '../utils/fnv1a';
import { AiSystem } from './AiSystem';
import type { Controller } from './Controller.types';

const EVERY = 5;
const cadenceWith = (maxDecisionsPerTick: number): AiCadence => ({
  everyTicks: {
    player: 1,
    'bot-legend': EVERY,
    rover: EVERY,
    minion: EVERY,
    guard: EVERY,
    turret: EVERY,
    boss: EVERY,
  },
  maxDecisionsPerTick,
});

/** A controller that stops every entity it is asked about and records who asked. */
const stopper = (asked: EntityId[]): Controller => ({
  id: 'minion',
  decide: (_state, entityId) => {
    asked.push(entityId);
    return [{ type: 'stop', actorId: entityId }];
  },
});

const setUp = (count: number, maxDecisionsPerTick = 100, seed = 1) => {
  const state = new GameState(createDefaultGameConfig(), seed);
  const definitions = new ContentCatalogue<UnitDefinition>([
    { ...LIGHT_MINION, id: 'bot-minion', controller: 'minion' },
    LIGHT_MINION,
  ]);
  const factory = new EntityFactory(createDefaultEntityRegistry(), definitions);
  const ids = Array.from({ length: count }, (_, index) => {
    const entity = factory.create('light-mob', 'bot-minion', {
      team: 'light',
      position: { x: index, y: 0 },
    });
    state.entities.add(entity);
    return entity.id;
  });
  state.entities.add(
    factory.create('light-mob', 'light-minion', { team: 'light', position: { x: 0, y: 0 } }),
  );
  const asked: EntityId[] = [];
  const queued: Command[] = [];
  const system = new AiSystem(
    state,
    { minion: stopper(asked) },
    cadenceWith(maxDecisionsPerTick),
    (command) => queued.push(command),
  );
  const step = () => {
    system.update({ state });
    state.advanceTick();
  };
  return { state, ids, asked, queued, step };
};

describe('AiSystem', () => {
  it('gives every controlled entity a seeded brain and nothing else one', () => {
    const { state, ids, step } = setUp(2);
    const other = setUp(2);

    step();
    other.step();

    expect(state.ai.size).toBe(2);
    expect(state.ai.get(ids[0] ?? '')).toMatchObject({
      controllerId: 'minion',
      profileId: 'minion',
    });
    expect(state.ai.get(ids[0] ?? '')?.rngState).toEqual(
      other.state.ai.get(ids[0] ?? '')?.rngState,
    );
    expect(state.ai.get(ids[0] ?? '')?.rngState).not.toEqual(state.ai.get(ids[1] ?? '')?.rngState);
  });

  it('asks each entity once per cadence, on its own tick, and queues its commands', () => {
    const { ids, asked, queued, step } = setUp(8);

    for (let tick = 0; tick < 2 * EVERY; tick += 1) {
      step();
    }

    for (const id of ids) {
      expect(asked.filter((each) => each === id)).toHaveLength(2);
      const first = asked.indexOf(id);
      expect(first).toBeGreaterThanOrEqual(0);
    }
    expect(queued).toContainEqual({ type: 'stop', actorId: ids[0] });
    // The tick an entity decides on follows its id's hash, so the eight are spread out.
    const ticks = new Set(ids.map((id) => (EVERY - (fnv1a(id) % EVERY)) % EVERY));
    expect(ticks.size).toBeGreaterThan(1);
  });

  it('defers decisions past the budget and lets them go first next tick', () => {
    const { state, asked, step } = setUp(40, 3);

    step();
    const firstTick = [...asked];
    const deferred = [...state.ai.deferred];
    step();

    expect(firstTick).toHaveLength(3);
    expect(deferred.length).toBeGreaterThan(0);
    expect(asked.slice(3, 3 + Math.min(3, deferred.length))).toEqual(deferred.slice(0, 3));
  });

  it('drops a removed entity’s brain on its next pass', () => {
    const { state, ids, step } = setUp(1);
    step();

    state.entities.remove(ids[0] ?? '', 'dev-removed');
    state.events.emit('entity-removed', { entityId: ids[0] ?? '', cause: 'dev-removed' });
    expect(state.ai.size).toBe(1);
    step();

    expect(state.ai.size).toBe(0);
  });

  it('throws when an entity names a controller with no implementation', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const definitions = new ContentCatalogue<UnitDefinition>([
      { ...LIGHT_MINION, controller: 'guard' },
    ]);
    const factory = new EntityFactory(createDefaultEntityRegistry(), definitions);
    const guard = factory.create('light-mob', 'light-minion', {
      team: 'light',
      position: { x: 0, y: 0 },
    });
    state.entities.add(guard);
    const system = new AiSystem(state, {}, cadenceWith(10), () => undefined);
    const dueTick = (EVERY - (fnv1a(guard.id) % EVERY)) % EVERY;
    while (state.tick < dueTick) {
      system.update({ state });
      state.advanceTick();
    }

    expect(() => {
      system.update({ state });
    }).toThrow('not registered');
  });
});
