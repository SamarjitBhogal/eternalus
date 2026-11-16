import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { VERDICT_LINES } from '../content/narrative/verdictLines';
import type { VerdictLines } from '../content/narrative/verdictLines.types';
import { GameState } from '../state/GameState';
import { createDefaultVictoryConditions } from './defaultVictoryConditions';

describe('createDefaultVictoryConditions', () => {
  it('gives every default condition its verdict lines, so a match it ends shows one (12 §9)', () => {
    const ids = createDefaultVictoryConditions(new GameState(createDefaultGameConfig(), 1)).map(
      ({ id }) => id,
    );

    const lines: VerdictLines = VERDICT_LINES;

    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => lines[id] === undefined)).toEqual([]);
  });
});
