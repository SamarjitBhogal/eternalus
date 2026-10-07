import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { applyCommand } from './applyCommand';
import type { Command } from './Command.types';
import { createDefaultCommandHandlers } from './defaultCommandHandlers';

const NOT_YET_SUPPORTED: readonly Command[] = [
  { type: 'move', actorId: 'entity-1', direction: { x: 0, y: -1 } },
  { type: 'stop', actorId: 'entity-1' },
  { type: 'attack-target', actorId: 'entity-1', targetId: 'entity-2' },
  {
    type: 'cast-ability',
    actorId: 'entity-1',
    slot: 'ability-1',
    aim: { point: { x: 1, y: 1 }, targetId: null },
  },
  {
    type: 'intent',
    actorId: 'entity-1',
    intent: { move: { x: 1, y: 0 }, aim: null, triggered: ['ability-2'] },
  },
  { type: 'dev-set-controller', entityId: 'entity-1', controllerId: 'bot-legend' },
];

describe('createDefaultCommandHandlers', () => {
  it.each(NOT_YET_SUPPORTED)(
    'rejects $type as not supported until its system exists',
    (command) => {
      const state = new GameState(createDefaultGameConfig(), 1);
      const reasons: string[] = [];
      state.events.on('command-rejected', ({ reason }) => reasons.push(reason));
      applyCommand(command, createDefaultCommandHandlers(), {
        state,
        factory: new EntityFactory(),
      });
      expect(reasons).toEqual(['not-supported']);
    },
  );
});
