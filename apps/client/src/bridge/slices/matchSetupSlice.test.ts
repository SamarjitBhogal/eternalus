import { describe, expect, it } from 'vitest';

import type { ClassSelection } from '../events';
import { matchSetupSlice } from './matchSetupSlice';

const { select, setCountdown } = matchSetupSlice.actions;
const { selectSelection, selectCountdownSeconds, selectPlayerTeam, selectAllies } =
  matchSetupSlice.selectors;

describe('matchSetupSlice', () => {
  it('stores a pick as given and clears it on null', () => {
    const pick: ClassSelection = { classId: 'magus', specId: 'oracle' };
    let matchSetup = matchSetupSlice.reducer(undefined, select(pick));
    expect(selectSelection({ matchSetup })).toBe(pick);
    matchSetup = matchSetupSlice.reducer(matchSetup, select(null));
    expect(selectSelection({ matchSetup })).toEqual({ classId: null, specId: null });
  });

  it('shows the countdown in whole seconds, rounded up', () => {
    const seconds = (remainingMs: number) =>
      selectCountdownSeconds({
        matchSetup: matchSetupSlice.reducer(undefined, setCountdown(remainingMs)),
      });
    expect(seconds(42_000)).toBe(42);
    expect(seconds(41_001)).toBe(42);
    expect(seconds(0)).toBe(0);
  });

  it('has no team and no allies before a setup', () => {
    const state = { matchSetup: matchSetupSlice.getInitialState() };
    expect(selectPlayerTeam(state)).toBeNull();
    expect(selectAllies(state)).toEqual([]);
  });
});
