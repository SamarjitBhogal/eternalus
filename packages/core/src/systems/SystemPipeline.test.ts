import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { GameState } from '../state/GameState';
import type { System, SystemContext } from './System.types';
import { SystemPipeline } from './SystemPipeline';

const recorder = (name: string, calls: string[]): System => ({
  name,
  update: ({ state }) => calls.push(`${name}@${String(state.tick)}`),
});

describe('SystemPipeline', () => {
  it('runs every system once per run, in registration order, with the shared context', () => {
    const calls: string[] = [];
    const pipeline = new SystemPipeline([recorder('commands', calls), recorder('movement', calls)]);
    const context: SystemContext = {
      state: new GameState(createDefaultGameConfig(), 1),
      logger: new MemoryLogger(),
    };
    pipeline.run(context);
    context.state.advanceTick();
    pipeline.run(context);
    expect(calls).toEqual(['commands@0', 'movement@0', 'commands@1', 'movement@1']);
  });

  it('does nothing without systems', () => {
    expect(() => {
      new SystemPipeline([]).run({
        state: new GameState(createDefaultGameConfig(), 1),
        logger: new MemoryLogger(),
      });
    }).not.toThrow();
  });
});
