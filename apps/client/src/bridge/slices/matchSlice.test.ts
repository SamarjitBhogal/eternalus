import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../__fixtures__/hudFixtures';
import { matchResultFixture } from '../__fixtures__/matchResultFixtures';
import { matchSlice } from './matchSlice';

const { clockChanged, structuresChanged, capturePointsChanged, ended, duelEnded, reset } =
  matchSlice.actions;
const {
  selectMatchClock,
  selectStructures,
  selectCapturePoints,
  selectMatchResult,
  selectMatchDurationSeconds,
  selectDuelOutcome,
} = matchSlice.selectors;

describe('matchSlice', () => {
  it('has no clock, rosters or result before the match publishes', () => {
    const state = { match: matchSlice.getInitialState() };
    expect(selectMatchClock(state)).toBeNull();
    expect(selectStructures(state)).toEqual([]);
    expect(selectCapturePoints(state)).toEqual([]);
    expect(selectMatchResult(state)).toBeNull();
    expect(selectMatchDurationSeconds(state)).toBeNull();
  });

  it("stores the ended match's result as given and its length, keeping the clock", () => {
    const result = matchResultFixture();
    const clock = { tick: 3610, seconds: 3610 / 30 };
    let match = matchSlice.reducer(undefined, clockChanged(clock));
    match = matchSlice.reducer(match, ended({ result, durationSeconds: 120 }));
    expect(selectMatchResult({ match })).toBe(result);
    expect(selectMatchDurationSeconds({ match })).toBe(120);
    expect(selectMatchClock({ match })).toBe(clock);
  });

  it('stores each payload as given', () => {
    const { clock, structures, capturePoints } = figmaHudState().match;
    if (clock === null) throw new Error('the Figma fixture has a clock');
    let match = matchSlice.reducer(undefined, clockChanged(clock));
    match = matchSlice.reducer(match, structuresChanged(structures));
    match = matchSlice.reducer(match, capturePointsChanged(capturePoints));
    expect(selectMatchClock({ match })).toBe(clock);
    expect(selectStructures({ match })).toBe(structures);
    expect(selectCapturePoints({ match })).toBe(capturePoints);
  });

  it("stores a Duel's outcome, a draw included", () => {
    const won = matchSlice.reducer(undefined, duelEnded({ winner: 'dark', reason: 'finished' }));
    expect(selectDuelOutcome({ match: won })).toEqual({
      winner: 'dark',
      reason: 'finished',
    });
    const drawn = matchSlice.reducer(won, duelEnded({ winner: null, reason: 'finished' }));
    expect(selectDuelOutcome({ match: drawn })).toEqual({
      winner: null,
      reason: 'finished',
    });
  });

  it('resets to the initial state', () => {
    const { structures } = figmaHudState().match;
    let match = matchSlice.reducer(undefined, structuresChanged(structures));
    match = matchSlice.reducer(match, ended({ result: matchResultFixture(), durationSeconds: 9 }));
    match = matchSlice.reducer(match, duelEnded({ winner: null, reason: 'opponent-left' }));
    expect(matchSlice.reducer(match, reset())).toEqual({
      clock: null,
      structures: [],
      capturePoints: [],
      result: null,
      durationSeconds: null,
      duel: null,
    });
  });
});
