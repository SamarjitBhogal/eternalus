import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { accessibleNames, renderWithStore } from '../testStore';
import { MatchCountdown } from './MatchCountdown';

const withCountdown = (countdown: number | null) => ({
  match: { ...matchSlice.getInitialState(), clock: { tick: 0, seconds: 0, countdown } },
});

describe('MatchCountdown', () => {
  it.each([10, 3, 1])('shows the number %i over the match as a labelled timer', (number) => {
    const html = renderWithStore(<MatchCountdown />, withCountdown(number));

    expect(html).toMatch(new RegExp(`role="timer"[^>]*>${String(number)}<`));
    expect(accessibleNames(html, '[role=timer]')).toEqual([STRINGS.hud.matchCountdown]);
  });

  it('draws the countdown glow it uses on the match screen', () => {
    expect(renderWithStore(<MatchCountdown />, withCountdown(10))).toContain(
      'id="sel-glow-countdown"',
    );
  });

  it('shows START at 0', () => {
    expect(renderWithStore(<MatchCountdown />, withCountdown(0))).toMatch(
      new RegExp(`role="timer"[^>]*>${STRINGS.hud.countdownStart}<`),
    );
  });

  it('renders nothing once the countdown is over, and before the first clock', () => {
    expect(renderWithStore(<MatchCountdown />, withCountdown(null))).toBe('');
    expect(renderWithStore(<MatchCountdown />)).toBe('');
  });
});
