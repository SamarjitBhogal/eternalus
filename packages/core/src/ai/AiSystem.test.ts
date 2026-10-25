import { describe, expect, it } from 'vitest';

import type { Command } from '../commands/Command.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { AiSystem } from './AiSystem';
import type { Controller } from './Controller.types';
import { loadWeapons } from '../content/weapons/loadWeapons';

const newFactory = (): EntityFactory =>
  new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );

describe('AiSystem', () => {
  it('queues the decisions of each controlled entity, in store order', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = newFactory();
    const spawn = (kind: string, definitionId: string) => {
      const entity = factory.create(kind, definitionId, {
        position: { x: 0, y: 0 },
        team: 'light',
      });
      state.entities.add(entity);
      return entity.id;
    };
    const first = spawn('light-mob', 'light-minion');
    spawn('warrior', 'warrior');
    spawn('light-mob', 'training-dummy');
    const second = spawn('light-mob', 'light-minion');
    const stopper: Controller = {
      id: 'follow-leader',
      cadenceTicks: 1,
      decide: (_state, entityId) => [{ type: 'stop', actorId: entityId }],
    };
    const queued: Command[] = [];

    new AiSystem([stopper], (command) => queued.push(command)).update({ state });

    expect(queued).toEqual([
      { type: 'stop', actorId: first },
      { type: 'stop', actorId: second },
    ]);
  });

  it('asks each entity only on its own cadence tick, spread by store position', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = newFactory();
    const ids = [0, 1, 2].map(() => {
      const entity = factory.create('light-mob', 'light-minion', {
        position: { x: 0, y: 0 },
        team: 'light',
      });
      state.entities.add(entity);
      return entity.id;
    });
    const asked: string[] = [];
    const recorder: Controller = {
      id: 'follow-leader',
      cadenceTicks: 3,
      decide: (_state, entityId) => {
        asked.push(entityId);
        return [];
      },
    };
    const system = new AiSystem([recorder], () => undefined);

    for (let tick = 0; tick < 3; tick += 1) {
      system.update({ state });
      expect(asked).toHaveLength(tick + 1);
      state.advanceTick();
    }
    expect([...asked].sort()).toEqual([...ids].sort());
  });

  it('throws when an entity names a controller that is not registered', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = newFactory();
    state.entities.add(
      factory.create('light-mob', 'light-minion', { position: { x: 0, y: 0 }, team: 'light' }),
    );

    expect(() => {
      new AiSystem([], () => undefined).update({ state });
    }).toThrow('names unknown controller "follow-leader"');
  });
});
