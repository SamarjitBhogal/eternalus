import { describe, expect, it } from 'vitest';

import { matchResultFixture } from '../__fixtures__/matchResultFixtures';
import type { PlayableTeam } from '../domain.types';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { selectMatchVerdict } from './selectMatchVerdict';

/** The store after `match-ended` with `winner`, the setup's team being `team`. */
const verdictOf = (winner: PlayableTeam | null | 'no-result', team: PlayableTeam | null) =>
  selectMatchVerdict({
    match: {
      ...matchSlice.getInitialState(),
      // The result's own playerTeam is the other team, so only the setup's team can decide.
      result:
        winner === 'no-result'
          ? null
          : matchResultFixture({ winner, playerTeam: team === 'light' ? 'dark' : 'light' }),
    },
    matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: team },
  });

describe('selectMatchVerdict', () => {
  it.each([
    ['light', 'light', 'victory'],
    ['dark', 'dark', 'victory'],
    ['dark', 'light', 'defeat'],
    ['light', 'dark', 'defeat'],
    [null, 'light', 'draw'],
    [null, 'dark', 'draw'],
  ] as const)('winner %s for the setup team %s is %s', (winner, team, verdict) => {
    expect(verdictOf(winner, team)).toBe(verdict);
  });

  it('is null before the match ends, and without a setup', () => {
    expect(verdictOf('no-result', 'light')).toBeNull();
    expect(verdictOf('light', null)).toBeNull();
  });
});
