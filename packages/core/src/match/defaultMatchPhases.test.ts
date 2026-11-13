import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES } from '../config/matchPhases';
import { GameState } from '../state/GameState';
import type { MatchState } from '../state/MatchState.types';
import { createDefaultMatchPhases } from './defaultMatchPhases';
import type { DirectorContext } from './DirectorContext.types';

/** Every `MatchState` field, read through `MatchRecord`'s getters (its private fields are not the state). */
const fieldsOf = (match: MatchState): MatchState => ({
  phase: match.phase,
  phaseEnteredTick: match.phaseEnteredTick,
  timelineCursor: match.timelineCursor,
  schedule: match.schedule,
  isIdleHeld: match.isIdleHeld,
  playerTeam: match.playerTeam,
  humanLegendId: match.humanLegendId,
  result: match.result,
  duel: match.duel,
});

describe('createDefaultMatchPhases', () => {
  it('registers one state per phase, under its own phase', () => {
    const phases = createDefaultMatchPhases();

    expect(MATCH_PHASES.map((phase) => phases[phase].phase)).toEqual([...MATCH_PHASES]);
  });

  it('gives every phase but the countdown no rules yet: entering, updating and leaving change nothing', () => {
    const phases = createDefaultMatchPhases();
    const state = new GameState(createDefaultGameConfig(), 1);
    const context: DirectorContext = { state, enterPhase: () => undefined };
    const before = fieldsOf(state.match);

    for (const phase of MATCH_PHASES.filter((name) => name !== 'countdown')) {
      phases[phase].enter(context);
      phases[phase].update(context);
      phases[phase].exit(context);
    }

    expect(fieldsOf(state.match)).toEqual(before);
    expect(state.events.recentEvents()).toEqual([]);
  });
});
