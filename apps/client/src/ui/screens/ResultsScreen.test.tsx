import { describe, expect, it } from 'vitest';

import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { ResultsScreen } from './ResultsScreen';

/** Team names no shipped content uses, so a verdict naming them can only come from content. */
const withResult = (result: ReturnType<typeof matchSlice.getInitialState>['result']) => ({
  match: { ...matchSlice.getInitialState(), result },
  content: { ...TEST_CONTENT, teamNames: { light: 'Lux', dark: 'Umbra' } },
});

const withAllies = () => ({
  ...matchSetupSlice.getInitialState(),
  allies: [
    {
      legendId: 'light-1',
      displayName: 'Tester',
      classId: 'sentinel',
      specId: null,
      isBot: false,
      isPlayer: true,
      isRover: true,
      team: 'light',
    },
  ] as const,
});

describe('ResultsScreen', () => {
  it.each([
    [null, STRINGS.results.noResult],
    [{ winner: null, ownTeam: 'light', reason: 'finished' }, STRINGS.results.draw],
    [{ winner: 'light', ownTeam: 'light', reason: 'finished' }, STRINGS.results.victory],
    [{ winner: 'dark', ownTeam: 'light', reason: 'finished' }, STRINGS.results.defeat],
    [{ winner: 'dark', ownTeam: 'dark', reason: 'opponent-left' }, STRINGS.results.opponentLeft],
  ] as const)('shows the verdict for %j from the player own team', (result, verdict) => {
    const html = renderWithStore(<ResultsScreen />, withResult(result));
    expect(html).toContain(verdict);
  });

  it('offers a rematch and the main menu after a match with a setup', () => {
    const html = renderWithStore(<ResultsScreen />, { matchSetup: withAllies() });
    expect(buttonNames(html)).toEqual([STRINGS.results.playAgain, STRINGS.results.mainMenu]);
  });

  it('offers only the main menu after an online Duel, which has no setup to repeat', () => {
    const html = renderWithStore(<ResultsScreen />);
    expect(buttonNames(html)).toEqual([STRINGS.results.mainMenu]);
  });
});
