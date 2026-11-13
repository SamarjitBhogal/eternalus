import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../__fixtures__/hudFixtures';
import { matchSlice } from './matchSlice';

const { clockChanged, structuresChanged, capturePointsChanged, resultChanged, reset } =
  matchSlice.actions;
const { selectMatchClock, selectStructures, selectCapturePoints, selectMatchResult } =
  matchSlice.selectors;

describe('matchSlice', () => {
  it('has no clock, rosters or result before the match publishes', () => {
    const state = { match: matchSlice.getInitialState() };
    expect(selectMatchClock(state)).toBeNull();
    expect(selectStructures(state)).toEqual([]);
    expect(selectCapturePoints(state)).toEqual([]);
    expect(selectMatchResult(state)).toBeNull();
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

  it('stores the Duel names and scoreboard, and has none outside a Duel', () => {
    expect(matchSlice.selectors.selectVersus({ match: matchSlice.getInitialState() })).toBeNull();
    expect(matchSlice.selectors.selectDuel({ match: matchSlice.getInitialState() })).toBeNull();
    const duel = { ownKills: 2, opponentKills: 0, killTarget: 10, countdown: 3 };
    let match = matchSlice.reducer(
      undefined,
      matchSlice.actions.versusChanged({ own: 'A', opponent: 'B' }),
    );
    match = matchSlice.reducer(match, matchSlice.actions.duelChanged(duel));
    expect(matchSlice.selectors.selectVersus({ match })).toEqual({ own: 'A', opponent: 'B' });
    expect(matchSlice.selectors.selectDuel({ match })).toBe(duel);
  });

  it('stores the result, a draw included', () => {
    const won = matchSlice.reducer(
      undefined,
      resultChanged({ winner: 'dark', ownTeam: 'light', reason: 'finished' }),
    );
    expect(selectMatchResult({ match: won })).toEqual({
      winner: 'dark',
      ownTeam: 'light',
      reason: 'finished',
    });
    const drawn = matchSlice.reducer(
      won,
      resultChanged({ winner: null, ownTeam: 'light', reason: 'finished' }),
    );
    expect(selectMatchResult({ match: drawn })).toEqual({
      winner: null,
      ownTeam: 'light',
      reason: 'finished',
    });
  });

  it("stores the disconnected opponent's reconnect window and clears it on reconnect", () => {
    let match = matchSlice.reducer(undefined, matchSlice.actions.opponentPresenceChanged(10_000));
    expect(matchSlice.selectors.selectOpponentGraceMs({ match })).toBe(10_000);
    match = matchSlice.reducer(match, matchSlice.actions.opponentPresenceChanged(null));
    expect(matchSlice.selectors.selectOpponentGraceMs({ match })).toBeNull();
  });

  it('resets to the initial state', () => {
    const { structures } = figmaHudState().match;
    const match = matchSlice.reducer(undefined, structuresChanged(structures));
    expect(matchSlice.reducer(match, reset())).toEqual({
      clock: null,
      structures: [],
      capturePoints: [],
      result: null,
      versus: null,
      duel: null,
      opponentGraceMs: null,
    });
  });
});
