import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../../config/matchPhases';
import { GameState } from '../../state/GameState';
import { PhaseMonotonicInvariant } from './PhaseMonotonicInvariant';

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const check = () => new PhaseMonotonicInvariant(MATCH_PHASES, TERMINAL_MATCH_PHASES).check(state);
  return { state, check };
};

describe('PhaseMonotonicInvariant', () => {
  it('holds while the match moves forward, phases skipped or not', () => {
    const { state, check } = setUp();
    state.setPhase('early-game');
    state.setPhase('mid-game');

    expect(check()).toEqual([]);
  });

  it('flags a move back to an earlier phase, deliberately triggered', () => {
    const { state, check } = setUp();
    state.setPhase('mid-game');
    state.advanceTick();

    state.setPhase('early-game');

    expect(check()).toEqual([
      {
        invariantId: 'phase-monotonic',
        severity: 'error',
        message: 'The match phase moved from "mid-game" to "early-game", which is not forward.',
        entityId: null,
        details: { from: 'mid-game', to: 'early-game' },
      },
    ]);
  });

  it('flags a move out of a terminal phase, though victory -> defeat is forward in the order', () => {
    const { state, check } = setUp();
    state.setPhase('victory');
    state.advanceTick();

    state.setPhase('defeat');

    expect(check()).toEqual([
      {
        invariantId: 'phase-monotonic',
        severity: 'error',
        message: 'The match phase moved from "victory" to "defeat", out of a terminal phase.',
        entityId: null,
        details: { from: 'victory', to: 'defeat' },
      },
    ]);
  });

  it('flags a move into the phase the match is already in', () => {
    const { state, check } = setUp();

    state.setPhase('countdown');

    expect(check().map(({ message }) => message)).toEqual([
      'The match phase moved from "countdown" to "countdown", which is not forward.',
    ]);
  });

  it("reads only this tick's changes: a bad move is reported on its own tick", () => {
    const { state, check } = setUp();
    state.setPhase('early-game');
    state.setPhase('countdown');
    expect(check()).toHaveLength(1);

    state.advanceTick();

    expect(check()).toEqual([]);
  });
});
