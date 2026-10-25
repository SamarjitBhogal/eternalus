import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { ResultsScreen } from './ResultsScreen';

/** Team names no shipped content uses, so a verdict naming them can only come from content. */
const withResult = (result: ReturnType<typeof matchSlice.getInitialState>['result']) => ({
  match: { ...matchSlice.getInitialState(), result },
  content: { ...TEST_CONTENT, teamNames: { light: 'Lux', dark: 'Umbra' } },
});

describe('ResultsScreen', () => {
  it.each([
    [null, STRINGS.results.noResult],
    [{ winner: null }, STRINGS.results.draw],
    [{ winner: 'light' }, STRINGS.results.winner('Lux')],
    [{ winner: 'dark' }, STRINGS.results.winner('Umbra')],
  ] as const)('shows the verdict for %j, naming the winner from content', (result, verdict) => {
    const html = renderWithStore(<ResultsScreen />, withResult(result));
    expect(html).toContain(verdict);
  });

  it('offers a rematch and the main menu', () => {
    const html = renderWithStore(<ResultsScreen />);
    expect(buttonNames(html)).toEqual([STRINGS.results.playAgain, STRINGS.results.mainMenu]);
  });
});
