import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { GameState } from '../state/GameState';
import { DefaultInvariantRunner } from './DefaultInvariantRunner';
import { InvariantRunner } from './InvariantRunner';
import { MemoryLogger } from './MemoryLogger';

describe('DefaultInvariantRunner', () => {
  it('is an InvariantRunner that passes on a clean state', () => {
    const runner = new DefaultInvariantRunner(
      { assertLevel: 'heavy', heavyEvery: 1, throwOnViolation: true },
      new MemoryLogger(),
    );

    expect(runner).toBeInstanceOf(InvariantRunner);
    expect(runner.run(new GameState(createDefaultGameConfig(), 1))).toEqual([]);
  });
});
