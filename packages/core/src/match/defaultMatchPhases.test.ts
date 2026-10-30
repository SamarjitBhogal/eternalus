import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES } from '../config/matchPhases';
import { GameState } from '../state/GameState';
import { createDefaultMatchPhases } from './defaultMatchPhases';
import type { DirectorContext } from './DirectorContext.types';

describe('createDefaultMatchPhases', () => {
  it('registers one state per phase, under its own phase', () => {
    const phases = createDefaultMatchPhases();

    expect(MATCH_PHASES.map((phase) => phases[phase].phase)).toEqual([...MATCH_PHASES]);
  });

  it('gives every phase but the countdown no rules yet: entering, updating and leaving change nothing', () => {
    const phases = createDefaultMatchPhases();
    const state = new GameState(createDefaultGameConfig(), 1);
    const context: DirectorContext = { state, enterPhase: () => undefined };
    const before = JSON.stringify(state.match);

    for (const phase of MATCH_PHASES.filter((name) => name !== 'countdown')) {
      phases[phase].enter(context);
      phases[phase].update(context);
      phases[phase].exit(context);
    }

    expect(JSON.stringify(state.match)).toBe(before);
    expect(state.events.recentEvents()).toEqual([]);
  });
});
