import { describe, expect, it } from 'vitest';

import type { Command } from '../commands/Command.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { AiCadence } from '../content/ai/ai.types';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { LIGHT_MINION } from '../content/mobs/lightMinion';
import { TRAINING_DUMMY } from '../content/mobs/trainingDummy';
import type { UnitDefinition } from '../content/units/units.types';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { EntityId } from '../state/EntityStore.types';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
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
  hasProfile: (profileId) => profileId === 'lane-minion',
  decide: ({ entityId, brain }) => {
    asked.push(entityId);
    const decisions = typeof brain.memory.decisions === 'number' ? brain.memory.decisions : 0;
    return {
      commands: [{ type: 'stop', actorId: entityId }],
      memory: { decisions: decisions + 1 },
      rngState: brain.rngState,
    };
  },
});

const setUp = (count: number, maxDecisionsPerTick = 100, seed = 1) => {
  const state = new GameState(createDefaultGameConfig(), seed);
  const definitions = new ContentCatalogue<UnitDefinition>([
    { ...LIGHT_MINION, id: 'bot-minion', controller: 'minion' },
    TRAINING_DUMMY,
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
    factory.create('light-mob', 'training-dummy', { team: 'light', position: { x: 0, y: 0 } }),
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
      profileId: 'lane-minion',
    });
    expect(state.ai.get(ids[0] ?? '')?.rngState).toEqual(
      other.state.ai.get(ids[0] ?? '')?.rngState,
    );
    expect(state.ai.get(ids[0] ?? '')?.rngState).not.toEqual(state.ai.get(ids[1] ?? '')?.rngState);
  });

  it('asks each entity once per cadence, on its own tick, and queues its commands', () => {
    const { state, ids, asked, queued, step } = setUp(8);
    const askedOn: number[] = [];

    for (let tick = 0; tick < 2 * EVERY; tick += 1) {
      const before = asked.length;
      step();
      askedOn.push(...asked.slice(before).map(() => state.tick - 1));
    }

    for (const id of ids) {
      expect(asked.filter((each) => each === id)).toHaveLength(2);
    }
    asked.forEach((id, at) => {
      expect(((askedOn[at] ?? 0) + fnv1a(id)) % EVERY).toBe(0);
    });
    expect(new Set(askedOn).size).toBeGreaterThan(2);
    expect(queued).toContainEqual({ type: 'stop', actorId: ids[0] });
  });

  it('asks the same entities in the same order on every run with the same seed', () => {
    const first = setUp(30, 4);
    const second = setUp(30, 4);

    for (let tick = 0; tick < 20; tick += 1) {
      first.step();
      second.step();
    }

    expect(first.asked).toEqual(second.asked);
    expect(first.state.ai.deferred).toEqual(second.state.ai.deferred);
    expect(new StateHasher().hash(first.state)).toBe(new StateHasher().hash(second.state));
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

  it('starts a brain with the memory its spawn gave it', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(
      createDefaultEntityRegistry(),
      new ContentCatalogue<UnitDefinition>([TRAINING_DUMMY]),
    );
    const bot = factory.create('light-mob', 'training-dummy', {
      team: 'light',
      position: { x: 0, y: 0 },
      controller: { controllerId: 'minion', profileId: 'lane-minion', memory: { lane: 'l0' } },
    });
    state.entities.add(bot);

    const keeper: Controller = {
      id: 'minion',
      hasProfile: () => true,
      decide: ({ brain }) => ({ commands: [], memory: brain.memory, rngState: brain.rngState }),
    };
    new AiSystem(state, { minion: keeper }, cadenceWith(10), () => undefined).update({ state });

    expect(state.ai.get(bot.id)).toMatchObject({
      profileId: 'lane-minion',
      memory: { lane: 'l0' },
    });
  });

  it('writes the memory a controller returns back to its brain', () => {
    const { state, ids, step } = setUp(1);

    for (let tick = 0; tick < 2 * EVERY; tick += 1) {
      step();
    }

    expect(state.ai.get(ids[0] ?? '')?.memory).toEqual({ decisions: 2 });
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

  it('throws the first tick it sees an entity whose controller has no implementation', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const definitions = new ContentCatalogue<UnitDefinition>([
      { ...LIGHT_MINION, controller: 'guard' },
    ]);
    const factory = new EntityFactory(createDefaultEntityRegistry(), definitions);
    state.entities.add(
      factory.create('light-mob', 'light-minion', { team: 'light', position: { x: 0, y: 0 } }),
    );
    const system = new AiSystem(state, {}, cadenceWith(10), () => undefined);

    expect(() => {
      system.update({ state });
    }).toThrow('not registered');
  });

  it('throws the first tick it sees an entity whose AI profile its controller does not have', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const definitions = new ContentCatalogue<UnitDefinition>([
      { ...LIGHT_MINION, controller: 'minion', aiProfile: 'no-such-profile' },
    ]);
    const factory = new EntityFactory(createDefaultEntityRegistry(), definitions);
    state.entities.add(
      factory.create('light-mob', 'light-minion', { team: 'light', position: { x: 0, y: 0 } }),
    );
    const system = new AiSystem(state, { minion: stopper([]) }, cadenceWith(10), () => undefined);

    expect(() => {
      system.update({ state });
    }).toThrow('AI profile "no-such-profile"');
    expect(state.ai.size).toBe(0);
  });

  it('checks the definitions against the registry before a match starts', () => {
    expect(() => {
      AiSystem.assertRegistered(
        [{ id: 'a' }, { id: 'b', controller: 'minion', aiProfile: 'lane-minion' }],
        {
          minion: stopper([]),
        },
      );
    }).not.toThrow();
    expect(() => {
      AiSystem.assertRegistered([{ id: 'g', controller: 'guard' }], {});
    }).toThrow('Definition "g" names controller "guard"');
    expect(() => {
      AiSystem.assertRegistered([{ id: 'p', controller: 'minion', aiProfile: 'lane-minion' }], {
        minion: stopper([]),
      });
    }).not.toThrow();
    expect(() => {
      AiSystem.assertRegistered([{ id: 'p', controller: 'minion', aiProfile: 'typo' }], {
        minion: stopper([]),
      });
    }).toThrow('Definition "p" names AI profile "typo"');
  });

  it('falls back to the controller id as the profile when a definition names none', () => {
    const minion = (profiles: readonly string[]): Controller => ({
      ...stopper([]),
      hasProfile: (profileId) => profiles.includes(profileId),
    });

    expect(() => {
      AiSystem.assertRegistered([{ id: 'm', controller: 'minion' }], {
        minion: minion(['minion']),
      });
    }).not.toThrow();
    expect(() => {
      AiSystem.assertRegistered([{ id: 'm', controller: 'minion' }], {
        minion: minion(['lane-minion']),
      });
    }).toThrow('Definition "m" names AI profile "minion"');
  });
});
