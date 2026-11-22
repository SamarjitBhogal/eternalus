import { describe, expect, it } from 'vitest';

import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { STRINGS } from '../strings';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { SessionCountdown } from './SessionCountdown';

const render = (countdownMs: number): string =>
  renderWithStore(
    <SessionCountdown kind="select" label={STRINGS.characterSelect.countdownLabel} />,
    {
      matchSetup: {
        ...matchSetupSlice.getInitialState(),
        countdownsMs: { select: countdownMs, reveal: 0, results: 0 },
      },
    },
  );

describe('SessionCountdown', () => {
  it('reads the countdown its kind names, under its label (the win/lose screen)', () => {
    const html = renderWithStore(
      <SessionCountdown kind="results" label={STRINGS.results.countdownLabel} />,
      {
        matchSetup: {
          ...matchSetupSlice.getInitialState(),
          countdownsMs: { select: 42_000, reveal: 3_000, results: 7_000 },
        },
      },
    );
    expect(html).toMatch(/role="timer"[^>]*>7</);
    expect(accessibleNames(html, '[role=timer]')).toEqual([STRINGS.results.countdownLabel]);
  });

  it("shows the session's countdown in whole seconds, rounded up", () => {
    expect(render(42_000)).toMatch(/^<p [^>]*role="timer"[^>]*>42<\/p>$/);
    expect(render(9_001)).toMatch(/role="timer"[^>]*>10</);
    expect(render(0)).toMatch(/role="timer"[^>]*>0</);
  });

  // UE-01 (DEC-282) takes part where the screen asks for it: the character select, not the
  // win/lose screen, whose countdown keeps the static look.
  it('passes urgency through only where the screen asks for it', () => {
    const at10 = (kind: 'select' | 'results', hasUrgency: boolean): string =>
      renderWithStore(<SessionCountdown kind={kind} label="Time left" hasUrgency={hasUrgency} />, {
        content: { ...TEST_CONTENT, uiEnhancements: ['countdown-urgency'] },
        matchSetup: {
          ...matchSetupSlice.getInitialState(),
          countdownsMs: { select: 10_000, reveal: 0, results: 10_000 },
        },
      });

    expect(at10('select', true)).toContain('data-urgent="tick"');
    expect(at10('results', false)).not.toContain('data-urgent');
  });

  it('is named as the time left to choose', () => {
    expect(accessibleNames(render(42_000), '[role=timer]')).toEqual([
      STRINGS.characterSelect.countdownLabel,
    ]);
  });
});
