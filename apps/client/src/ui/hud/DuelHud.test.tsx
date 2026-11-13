import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { renderWithStore } from '../testStore';
import { DuelHud } from './DuelHud';

const withDuel = (countdown: number | null) => ({
  match: {
    ...matchSlice.getInitialState(),
    duel: { ownKills: 3, opponentKills: 1, killTarget: 10, countdown },
  },
});

describe('DuelHud', () => {
  it('shows the kills scoreboard with the target', () => {
    const html = renderWithStore(<DuelHud />, withDuel(null));

    expect(html).toContain('3 - 1');
    expect(html).toContain(STRINGS.hud.duelFirstTo(10));
    expect(html).not.toContain('role="timer"');
  });

  it.each([3, 2, 1])('shows the countdown number %i', (number) => {
    expect(renderWithStore(<DuelHud />, withDuel(number))).toMatch(
      new RegExp(`role="timer"[^>]*>${String(number)}<`),
    );
  });

  it('shows START at 0', () => {
    expect(renderWithStore(<DuelHud />, withDuel(0))).toContain(STRINGS.hud.duelStart);
  });

  it('renders nothing outside a Duel', () => {
    expect(renderWithStore(<DuelHud />)).toBe('');
  });
});
