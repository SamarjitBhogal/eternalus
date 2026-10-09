import { describe, expect, it } from 'vitest';

import type { Command } from '../commands/Command.types';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { AiSystem } from './AiSystem';
import type { Controller } from './Controller.types';

describe('AiSystem', () => {
  it('queues the decisions of each controlled entity, in store order', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
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
      decide: (_state, entityId) => [{ type: 'stop', actorId: entityId }],
    };
    const queued: Command[] = [];

    new AiSystem([stopper], (command) => queued.push(command)).update({ state });

    expect(queued).toEqual([
      { type: 'stop', actorId: first },
      { type: 'stop', actorId: second },
    ]);
  });

  it('skips entities whose controller is not registered', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
    state.entities.add(
      factory.create('light-mob', 'light-minion', { position: { x: 0, y: 0 }, team: 'light' }),
    );
    const queued: Command[] = [];

    new AiSystem([], (command) => queued.push(command)).update({ state });

    expect(queued).toEqual([]);
  });
});
