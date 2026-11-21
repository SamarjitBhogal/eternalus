import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { renderWithStore } from '../testStore';
import { DuelVersusScreen } from './DuelVersusScreen';

describe('DuelVersusScreen', () => {
  it('shows both names around VS', () => {
    const html = renderWithStore(<DuelVersusScreen />, {
      match: { ...matchSlice.getInitialState(), versus: { own: 'Ana', opponent: 'Ben' } },
    });

    expect(html.replace(/<!-- -->/g, '')).toContain('Ana VS Ben');
  });
});
