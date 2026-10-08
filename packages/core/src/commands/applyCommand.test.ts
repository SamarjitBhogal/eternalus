import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { applyCommand } from './applyCommand';
import type { CommandContext, CommandHandlers } from './CommandHandler.types';
import { createDefaultCommandHandlers } from './defaultCommandHandlers';

const context = (): CommandContext => ({
  state: new GameState(createDefaultGameConfig(), 1),
  factory: new EntityFactory(),
});

describe('applyCommand', () => {
  it('dispatches to the handler registered for the command type', () => {
    const seen: string[] = [];
    const handlers: CommandHandlers = {
      ...createDefaultCommandHandlers(),
      stop: {
        handle: (command) => {
          seen.push(command.actorId);
          return null;
        },
      },
    };
    const ctx = context();
    const rejected: unknown[] = [];
    ctx.state.events.on('command-rejected', (payload) => rejected.push(payload));
    applyCommand({ type: 'stop', actorId: 'entity-3' }, handlers, ctx);
    expect(seen).toEqual(['entity-3']);
    expect(rejected).toEqual([]);
  });

  it('announces a rejection with the command and the reason instead of throwing', () => {
    const ctx = context();
    const rejected: unknown[] = [];
    ctx.state.events.on('command-rejected', (payload) => rejected.push(payload));
    const command = { type: 'stop', actorId: 'entity-3' } as const;
    applyCommand(command, createDefaultCommandHandlers(), ctx);
    expect(rejected).toEqual([{ command, reason: 'not-supported' }]);
  });
});
