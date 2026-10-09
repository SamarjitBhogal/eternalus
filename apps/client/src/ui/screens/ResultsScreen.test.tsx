import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { buttonNames, renderWithStore } from '../testStore';
import { ResultsScreen } from './ResultsScreen';

const withResult = (result: ReturnType<typeof matchSlice.getInitialState>['result']) => ({
  match: { ...matchSlice.getInitialState(), result },
});

describe('ResultsScreen', () => {
  it.each([
    [null, STRINGS.results.noResult],
    [{ winner: null }, STRINGS.results.draw],
    [{ winner: 'light' }, STRINGS.results.winner.light],
    [{ winner: 'dark' }, STRINGS.results.winner.dark],
  ] as const)('shows the verdict for %j', (result, verdict) => {
    const html = renderWithStore(<ResultsScreen />, withResult(result));
    expect(html).toContain(verdict);
  });

  it('offers a rematch and the main menu', () => {
    const html = renderWithStore(<ResultsScreen />);
    expect(buttonNames(html)).toEqual([STRINGS.results.playAgain, STRINGS.results.mainMenu]);
  });
});
