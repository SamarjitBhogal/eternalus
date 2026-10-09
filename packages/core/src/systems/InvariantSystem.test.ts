import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { Invariant } from '../diagnostics/Invariant.types';
import { InvariantRunner } from '../diagnostics/InvariantRunner';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { GameState } from '../state/GameState';
import { InvariantSystem } from './InvariantSystem';

describe('InvariantSystem', () => {
  it('runs the runner on the tick state', () => {
    const checked: number[] = [];
    const spy: Invariant = {
      id: 'spy',
      severity: 'warn',
      cadence: 'tick',
      check: (state) => {
        checked.push(state.tick);
        return [];
      },
    };
    const logger = new MemoryLogger();
    const system = new InvariantSystem(
      new InvariantRunner(
        [spy],
        { assertLevel: 'light', heavyEvery: 1, throwOnViolation: true },
        logger,
      ),
    );
    const state = new GameState(createDefaultGameConfig(), 1);

    system.update({ state, logger });

    expect(system.name).toBe('invariants');
    expect(checked).toEqual([0]);
  });
});
