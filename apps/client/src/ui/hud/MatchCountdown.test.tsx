import { describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import countdownStyles from '../components/Countdown.module.css';
import { STRINGS } from '../strings';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { MatchCountdown } from './MatchCountdown';
import overlayCss from './MatchCountdown.module.css?raw';

const withCountdown = (countdown: number | null) => ({
  match: { ...matchSlice.getInitialState(), clock: { tick: 0, seconds: 0, countdown } },
});
/** The overlay at `countdown` with UE-01's id in the switch (ui-enhancements-plan §2 rule 1). */
const urgent = (countdown: number): string =>
  renderWithStore(<MatchCountdown />, {
    ...withCountdown(countdown),
    content: { ...TEST_CONTENT, uiEnhancements: ['countdown-urgency'] },
  });
const urgencyOf = (html: string): string | null =>
  /<p [^>]*data-urgent="(\w+)"/.exec(html)?.[1] ?? null;
const alertOf = (html: string): string | null =>
  /<span [^>]*aria-live="polite"[^>]*>([^<]*)<\/span>/.exec(html)?.[1] ?? null;

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

  // DEC-282: one source for the look and the urgency, the character select's Countdown at the
  // overlay's size; the strike-in is gone (UE-01's tick replaces it).
  it("draws the character select's countdown numeral at the match size, inside its veil", () => {
    const html = renderWithStore(<MatchCountdown />, withCountdown(7));

    expect(html).toContain(
      `<p class="${String(countdownStyles.countdown)} ${String(countdownStyles.match)}" role="timer"`,
    );
    expect(overlayCss).not.toMatch(/@keyframes|animation|filter|color:|font-/);
    expect(/\n\.veil \{([^}]*)\}/.exec(overlayCss)?.[1]).toContain('pointer-events: none;');
  });

  it.each([10, 5, 0])('stays static at %i with the switch off: no urgency, no live region', (n) => {
    const html = renderWithStore(<MatchCountdown />, withCountdown(n));

    expect(html).not.toContain('data-urgent');
    expect(html).not.toContain('aria-live');
  });

  // UE-01 on the overlay (DEC-282): the character select's thresholds; START counts as ≤ 5 s.
  it('ticks from 10, pulses with the urgent glow from 5 and at START, and says 10 and 5', () => {
    expect(
      [10, 9, 6, 5, 3, 1, 0].map((n) => [n, urgencyOf(urgent(n)), alertOf(urgent(n))]),
    ).toEqual([
      [10, 'tick', STRINGS.countdownAlert(10)],
      [9, 'tick', ''],
      [6, 'tick', ''],
      [5, 'final', STRINGS.countdownAlert(5)],
      [3, 'final', ''],
      [1, 'final', ''],
      [0, 'final', ''],
    ]);
    expect(urgent(0)).toMatch(new RegExp(`role="timer"[^>]*>${STRINGS.hud.countdownStart}<`));
    expect(accessibleNames(urgent(5), '[role=timer]')).toEqual([STRINGS.hud.matchCountdown]);
  });

  it('renders nothing once the countdown is over, and before the first clock', () => {
    expect(renderWithStore(<MatchCountdown />, withCountdown(null))).toBe('');
    expect(renderWithStore(<MatchCountdown />)).toBe('');
  });
});
