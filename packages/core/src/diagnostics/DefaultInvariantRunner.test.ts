import { describe, expect, it } from 'vitest';

import { loadLevelCurves } from '../content/progression/loadLevelCurves';

import { TEST_DEBUG_CONFIG } from './InvariantRunner.constants';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { GameState } from '../state/GameState';
import { DefaultInvariantRunner } from './DefaultInvariantRunner';
import { InvariantRunner } from './InvariantRunner';
import { MemoryLogger } from './MemoryLogger';

describe('DefaultInvariantRunner', () => {
  it('is an InvariantRunner that passes on a clean state', () => {
    const runner = new DefaultInvariantRunner(
      TEST_DEBUG_CONFIG,
      new MemoryLogger(),
      loadLevelCurves(),
    );

    expect(runner).toBeInstanceOf(InvariantRunner);
    expect(runner.run(new GameState(createDefaultGameConfig(), 1))).toEqual([]);
  });
});
