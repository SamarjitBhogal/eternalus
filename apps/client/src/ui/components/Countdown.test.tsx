import { describe, expect, it } from 'vitest';

import { accessibleNames, renderWithStore } from '../testStore';
import { Countdown } from './Countdown';
import countdownCss from './Countdown.module.css?raw';
import { SELECTION_DEF_IDS } from './SelectionDefs.constants';

describe('Countdown', () => {
  it.each([60, 42, 10, 1, 0])('shows %i seconds in the same static look', (seconds) => {
    const html = renderWithStore(<Countdown remainingSeconds={seconds} />);

    expect(html).toMatch(
      new RegExp(`^<p class="[^"]+" role="timer" aria-label="[^"]+">${String(seconds)}</p>$`),
    );
    expect(html).not.toContain('data-urgent');
    expect(html).not.toContain('aria-live');
  });

  it('is a timer named by its label', () => {
    expect(
      accessibleNames(renderWithStore(<Countdown remainingSeconds={42} />), '[role=timer]'),
    ).toEqual(['Time left to choose']);
  });

  it('takes its colours from tokens only', () => {
    const html = renderWithStore(<Countdown remainingSeconds={31} />);

    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    expect(countdownCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });

  // The visual audit of 62:125: as text-shadows the four glows left an orange ring around the
  // numerals that Figma does not draw.
  it('draws its four glows with the sel-glow-countdown def, never a text-shadow', () => {
    const rule = /\n\.countdown \{([^}]*)\}/.exec(countdownCss)?.[1] ?? 'missing';

    expect(rule).toContain(`filter: url(#${SELECTION_DEF_IDS.glowCountdown});`);
    expect(countdownCss).not.toMatch(/text-shadow\s*:/);
  });

  // The visual audit of 62:125, 62:70 and 58:271: Chrome draws the numerals 1 px above Figma's
  // in the same 83 px box, so the box sits 1 px below the Figma's (901, 104).
  it('puts the numerals on the Figma rows: the 118 × 83 box at (901, 105)', () => {
    const rule = /\n\.countdown \{([^}]*)\}/.exec(countdownCss)?.[1] ?? 'missing';

    expect(rule).toMatch(/left: 901px;\s*top: 105px;\s*width: 118px;\s*height: 83px;/);
  });
});
