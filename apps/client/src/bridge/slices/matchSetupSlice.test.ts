import { describe, expect, it } from 'vitest';

import type { ClassSelection } from '../events';
import { matchSetupSlice } from './matchSetupSlice';

const { lockIn, reset, select, setCountdown } = matchSetupSlice.actions;
const {
  selectSelection,
  selectCountdownSeconds,
  selectPlayerTeam,
  selectAllies,
  selectIsLockedIn,
} = matchSetupSlice.selectors;

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
    expect(selectIsLockedIn(state)).toBe(false);
  });

  it('locks in with the filled rosters, until a reset (DEC-60)', () => {
    const allies = [
      {
        legendId: 'light-1',
        displayName: 'Ada',
        classId: 'magus',
        specId: 'oracle',
        isBot: false,
        isPlayer: true,
        isRover: true,
        team: 'light',
      },
    ] as const;
    let matchSetup = matchSetupSlice.reducer(undefined, lockIn({ allies, enemies: [] }));
    expect(selectIsLockedIn({ matchSetup })).toBe(true);
    expect(selectAllies({ matchSetup })).toEqual(allies);
    matchSetup = matchSetupSlice.reducer(matchSetup, reset());
    expect(selectIsLockedIn({ matchSetup })).toBe(false);
  });
});
