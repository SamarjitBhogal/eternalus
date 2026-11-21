import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { renderWithStore } from '../testStore';
import { DuelHud } from './DuelHud';

const DUEL = {
  match: {
    ...matchSlice.getInitialState(),
    duelHud: { ownKills: 3, opponentKills: 1, killTarget: 10 },
  },
};

describe('DuelHud', () => {
  it('shows the kills scoreboard with the target', () => {
    const html = renderWithStore(<DuelHud />, DUEL);

    expect(html).toContain('3 - 1');
    expect(html).toContain(STRINGS.hud.duelFirstTo(10));
    expect(html).not.toContain('role="timer"');
  });

  it('renders nothing outside a Duel', () => {
    expect(renderWithStore(<DuelHud />)).toBe('');
  });
});
