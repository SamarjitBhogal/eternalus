import type { VictoryConditionId } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { matchResultFixture } from '../__fixtures__/matchResultFixtures';
import type { PlayableTeam } from '../domain.types';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { selectVerdictLine } from './selectVerdictLine';

/** Lines and names no shipped content uses, so a line naming them can only come from content. */
const CONTENT = {
  ...contentSlice.getInitialState(),
  verdictLines: {
    'objective-lost': {
      victory: 'Their {name} is down.',
      defeat: 'Our {name} is down.',
      draw: 'Each {name} is down; {name} too.',
    },
  },
  sovereignNames: { light: 'Queen', dark: 'Tyrant' },
};

const lineOf = (
  winner: PlayableTeam | null,
  team: PlayableTeam | null,
  condition: VictoryConditionId = 'objective-lost',
) =>
  selectVerdictLine({
    match: { ...matchSlice.getInitialState(), result: matchResultFixture({ winner, condition }) },
    matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: team },
    content: CONTENT,
  });

describe('selectVerdictLine', () => {
  it.each([
    ['light', 'light', 'Their Tyrant is down.'],
    ['dark', 'dark', 'Their Queen is down.'],
    ['dark', 'light', 'Our Queen is down.'],
    ['light', 'dark', 'Our Tyrant is down.'],
    [null, 'light', 'Each Queen is down; Queen too.'],
    [null, 'dark', 'Each Tyrant is down; Tyrant too.'],
  ] as const)(
    "winner %s for team %s: the player's line, naming the fallen sovereign",
    (winner, team, line) => {
      expect(lineOf(winner, team)).toBe(line);
    },
  );

  it('is null for a condition content has no line for, and before a result or setup', () => {
    expect(lineOf('light', 'light', 'forfeit')).toBeNull();
    expect(lineOf('light', null)).toBeNull();
    expect(
      selectVerdictLine({
        match: matchSlice.getInitialState(),
        matchSetup: { ...matchSetupSlice.getInitialState(), playerTeam: 'light' },
        content: CONTENT,
      }),
    ).toBeNull();
  });
});
