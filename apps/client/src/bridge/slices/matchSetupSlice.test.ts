import { describe, expect, it } from 'vitest';

import type { ClassSelection } from '../events';
import { matchSetupSlice } from './matchSetupSlice';

const { countdownChanged, lockIn, reset, select } = matchSetupSlice.actions;
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
      selectCountdownSeconds(
        {
          matchSetup: matchSetupSlice.reducer(
            undefined,
            countdownChanged({ kind: 'select', remainingMs }),
          ),
        },
        'select',
      );
    expect(seconds(42_000)).toBe(42);
    expect(seconds(41_001)).toBe(42);
    expect(seconds(0)).toBe(0);
  });

  it('keeps each countdown kind apart, each in whole seconds rounded up', () => {
    let matchSetup = matchSetupSlice.reducer(
      undefined,
      countdownChanged({ kind: 'select', remainingMs: 5_000 }),
    );
    matchSetup = matchSetupSlice.reducer(
      matchSetup,
      countdownChanged({ kind: 'reveal', remainingMs: 8_500 }),
    );
    const seconds = (remainingMs: number) => {
      matchSetup = matchSetupSlice.reducer(
        matchSetup,
        countdownChanged({ kind: 'results', remainingMs }),
      );
      return selectCountdownSeconds({ matchSetup }, 'results');
    };
    expect(seconds(30_000)).toBe(30);
    expect(seconds(29_001)).toBe(30);
    expect(seconds(0)).toBe(0);
    expect(selectCountdownSeconds({ matchSetup }, 'select')).toBe(5);
    expect(selectCountdownSeconds({ matchSetup }, 'reveal')).toBe(9);
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
