import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import { GameState } from '../state/GameState';
import { MatchDirectorSystem } from './MatchDirectorSystem';

describe('MatchDirectorSystem', () => {
  it("runs the director once per tick on the tick's state", () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const updated: GameState[] = [];
    const system = new MatchDirectorSystem({
      update: (updatedState) => {
        updated.push(updatedState);
      },
    });

    system.update({ state, logger: new NullLogger() });

    expect(system.name).toBe('match-director');
    expect(updated).toEqual([state]);
  });
});
