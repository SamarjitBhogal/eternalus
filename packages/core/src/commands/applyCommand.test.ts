import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { EntityFactory } from '../entities/EntityFactory';
import { EntityRegistry } from '../entities/EntityRegistry';
import { GameState } from '../state/GameState';
import { applyCommand } from './applyCommand';
import type { CommandContext, CommandHandlers } from './CommandHandler.types';
import { createDefaultCommandHandlers } from './defaultCommandHandlers';

const context = (): CommandContext => ({
  state: new GameState(createDefaultGameConfig(), 1),
  factory: new EntityFactory(new EntityRegistry(), new ContentCatalogue([])),
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
    expect(rejected).toEqual([{ command, reason: 'unknown-entity' }]);
  });

  it('applies no command once the match has ended (FR-002): the handler is skipped and the command rejected', () => {
    const ctx = context();
    let calls = 0;
    const handlers: CommandHandlers = {
      ...createDefaultCommandHandlers(),
      stop: {
        handle: () => {
          calls += 1;
          return null;
        },
      },
    };
    ctx.state.match.result = {
      winner: 'light',
      condition: 'objective-lost',
      playerTeam: 'light',
      hadHuman: false,
      durationTicks: 1,
      seed: 1,
      configHash: 0,
      legends: [],
      teams: { light: { score: 0 }, dark: { score: 0 } },
      finalHash: 0,
    };
    const rejected: unknown[] = [];
    ctx.state.events.on('command-rejected', (payload) => rejected.push(payload));
    const command = { type: 'stop', actorId: 'entity-3' } as const;

    applyCommand(command, handlers, ctx);

    expect(calls).toBe(0);
    expect(rejected).toEqual([{ command, reason: 'match-ended' }]);
  });
});
