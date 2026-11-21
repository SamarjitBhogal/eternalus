import { describe, expect, it } from 'vitest';

import globalCss from '../../styles/global.css?raw';
import { STRINGS } from '../strings';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { Countdown } from './Countdown';
import styles from './Countdown.module.css';
import countdownCss from './Countdown.module.css?raw';
import { SELECTION_DEF_IDS, TEXT_GLOW_FILTERS } from './SelectionDefs.constants';

/** The switch of ui-enhancements-plan §2 rule 1 holding UE-01's id. */
const URGENCY_ON = { content: { ...TEST_CONTENT, uiEnhancements: ['countdown-urgency'] as const } };
const SCOPE = ":root[data-ui-enhancements~='countdown-urgency']";

/** The character-select countdown (it takes part in UE-01) at `seconds`, the switch on. */
const urgent = (seconds: number): string =>
  renderWithStore(
    <Countdown remainingSeconds={seconds} label="Time left" hasUrgency />,
    URGENCY_ON,
  );
const urgencyOf = (html: string): string | null =>
  /<p [^>]*data-urgent="(\w+)"/.exec(html)?.[1] ?? null;
/** The declarations of the rule whose selector is exactly `selector` (outside any at-rule). */
const ruleOf = (selector: string): string =>
  new RegExp(`\\n${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(
    countdownCss,
  )?.[1] ?? 'missing';
const reducedMotionBlock = (css: string): string =>
  /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?\})\s*\}/.exec(css)?.[1] ?? 'missing';

describe('Countdown', () => {
  // The Figma original (ui-enhancements-plan §2 rule 6): with the switch off (TEST_CONTENT lists
  // no enhancement) no value carries an urgency state or a live region.
  it.each([60, 42, 10, 1, 0])('shows %i seconds in the same static look', (seconds) => {
    const html = renderWithStore(<Countdown remainingSeconds={seconds} label="Time left" />);

    expect(html).toMatch(
      new RegExp(`^<p class="[^"]+" role="timer" aria-label="[^"]+">${String(seconds)}</p>$`),
    );
    expect(html).not.toContain('data-urgent');
    expect(html).not.toContain('aria-live');
  });

  it.each([STRINGS.characterSelect.countdownLabel, STRINGS.results.countdownLabel])(
    'is a timer named by the label it is given: %s',
    (label) => {
      expect(
        accessibleNames(
          renderWithStore(<Countdown remainingSeconds={42} label={label} />),
          '[role=timer]',
        ),
      ).toEqual([label]);
    },
  );

  it('takes its colours from tokens only', () => {
    const html = renderWithStore(<Countdown remainingSeconds={31} label="Time left" />);

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
    const rule = /\n\.artboard \{([^}]*)\}/.exec(countdownCss)?.[1] ?? 'missing';

    expect(rule).toMatch(/left: 901px;\s*top: 105px;\s*width: 118px;\s*height: 83px;/);
  });
});

describe('Countdown urgency (UE-01, DEC-100, DEC-282)', () => {
  /** The select numeral's font size in artboard px (62:135, Cinzel Bold 64), from `.countdown`. */
  const fontPx = Number(/font-size: max\((\d+)px, /.exec(ruleOf('.countdown'))?.[1]);

  // The Figma original where UE-01 does not apply: a countdown that does not take part (the
  // win/lose screen's), even with the switch on.
  it.each([10, 5])('leaves a countdown that does not take part static at %i s', (seconds) => {
    const html = renderWithStore(
      <Countdown remainingSeconds={seconds} label="Time left" />,
      URGENCY_ON,
    );

    expect(html).toMatch(new RegExp(`^<p [^>]*>${String(seconds)}</p>$`));
    expect(html).not.toContain('data-urgent');
    expect(html).not.toContain('aria-live');
  });

  it.each([10, 5, 1])('stays static at %i s with the switch off', (seconds) => {
    const html = renderWithStore(
      <Countdown remainingSeconds={seconds} label="Time left" hasUrgency />,
    );

    expect(html).not.toContain('data-urgent');
    expect(html).not.toContain('aria-live');
  });

  it('ticks from 10 s down and not at 11 s; the final state from 5 s down and not at 6 s', () => {
    expect(
      [60, 11, 10, 9, 6, 5, 4, 1, 0].map((seconds) => [seconds, urgencyOf(urgent(seconds))]),
    ).toEqual([
      [60, null],
      [11, null],
      [10, 'tick'],
      [9, 'tick'],
      [6, 'tick'],
      [5, 'final'],
      [4, 'final'],
      [1, 'final'],
      [0, 'final'],
    ]);
  });

  it('keeps the numeral a timer named by its label, whatever the urgency', () => {
    expect(accessibleNames(urgent(5), '[role=timer]')).toEqual(['Time left']);
    expect(urgent(5)).toMatch(/^<p [^>]*role="timer"[^>]*>5<\/p>/);
  });

  // DEC-282 (7): the line goes into the app's one region (`LiveRegion`), never a region of the
  // countdown's own; Countdown.tick.test.tsx and MatchCountdown.line.test.tsx assert the lines at
  // 10 and 5 s on a mounted tree, in the region that was there first.
  it('draws no live region of its own at any second while the switch is on', () => {
    expect(
      [42, 11, 10, 9, 6, 5, 4, 0].filter((seconds) => urgent(seconds).includes('aria-live')),
    ).toEqual([]);
    expect(STRINGS.countdownAlert(10)).toBe('10 seconds left');
  });

  it('ticks once per second change (scale 1.08 over --motion-tick) only under the id scope', () => {
    const tick = ruleOf(`${SCOPE} .countdown[data-urgent]`);

    expect(tick).toMatch(/animation: tick var\(--motion-tick\) ease-out;/);
    expect(countdownCss).toMatch(
      /@keyframes tick \{\s*50% \{\s*transform: scale\(1\.08\);\s*\}\s*\}/,
    );
    const unscoped = [...countdownCss.matchAll(/\n([^\n{}@]+) \{([^}]*)\}/g)].filter(
      ([, selector = '', body = '']) =>
        /animation\s*:(?!\s*none)/.test(body) && !selector.startsWith(SCOPE),
    );
    expect(unscoped).toEqual([]);
  });

  it('pulses larger (scale 1.12) and draws the urgent glow from 5 s down, under the id scope', () => {
    const final = ruleOf(`${SCOPE} .countdown[data-urgent='final']`);

    expect(final).toMatch(/animation: pulse var\(--motion-tick\) ease-out;/);
    expect(final).toContain(`filter: url(#${SELECTION_DEF_IDS.glowCountdownUrgent});`);
    expect(countdownCss).toMatch(
      /@keyframes pulse \{\s*50% \{\s*transform: scale\(1\.12\);\s*\}\s*\}/,
    );
  });

  // Reduced motion (§2 rule 3): no tick and no pulse; the urgent glow and the lines stay.
  it('stops the tick and the pulse under both reduced-motion sources, keeping the urgent glow', () => {
    const stopped = /animation: none;/;

    expect(reducedMotionBlock(countdownCss)).toMatch(
      new RegExp(
        `${SCOPE.replace(/[[\]~'.]/g, '\\$&')} \\.countdown\\[data-urgent\\] \\{\\s*animation: none;\\s*\\}`,
      ),
    );
    expect(
      ruleOf(
        ":root[data-reduce-motion][data-ui-enhancements~='countdown-urgency'] .countdown[data-urgent]",
      ),
    ).toMatch(stopped);
    expect(reducedMotionBlock(countdownCss)).not.toContain('filter');
  });

  it('adds --motion-tick at 300 ms, zeroed under both reduced-motion sources', () => {
    const page = /\n:root \{([^}]*)\}/.exec(globalCss)?.[1] ?? 'missing';
    const inGame = /\n:root\[data-reduce-motion\] \{([^}]*)\}/.exec(globalCss)?.[1] ?? 'missing';

    expect(page).toMatch(/--motion-tick: 300ms;/);
    expect(reducedMotionBlock(globalCss)).toMatch(/--motion-tick: 0ms;/);
    expect(inGame).toMatch(/--motion-tick: 0ms;/);
  });

  // DEC-278, DEC-282: the pre-match overlay draws the same numeral at its own size. DEC-299 (2):
  // at the select's font size, where the glow def's px are sized, enlarged by `scale`, so the
  // glow grows with the numeral; a 216 artboard px font size (a recommendation, CD-49: "slightly
  // smaller" than 240).
  it('draws the match size by scaling the select-size numeral and shows the zero text for 0', () => {
    const html = renderWithStore(
      <Countdown remainingSeconds={0} label="Match start" size="match" zeroText="START" />,
    );
    const match = ruleOf('.match');

    expect(html).toContain(`class="${String(styles.countdown)} ${String(styles.match)}"`);
    expect(html).toMatch(/role="timer"[^>]*>START<\/p>$/);
    expect(match).not.toMatch(/font-size|transform:|translate:/);
    expect(match).toContain(`scale: calc(216 / ${String(fontPx)});`);
    expect(match).toMatch(
      /position: absolute;\s*inset: 0;\s*width: fit-content;\s*height: fit-content;[\s\S]*margin: auto;/,
    );
    expect(ruleOf('.countdown')).toMatch(/font-size: max\(64px, /);
  });

  // DEC-299 (2): the glow defs check their region against the overlay numeral's narrowest box, so
  // that box is read from the CSS that makes it: the select font size × `.match`'s line height,
  // at least `.match`'s min-width.
  it('gives the overlay numeral the box its glow defs are checked with', () => {
    const overlay = TEXT_GLOW_FILTERS.find(
      (def) => def.id === SELECTION_DEF_IDS.glowCountdown,
    )?.users.find((user) => user.node.includes('match-start overlay'));
    const match = ruleOf('.match');
    const lineHeight = Number(/line-height: ([\d.]+);/.exec(match)?.[1]);

    expect(match).toContain(`min-width: ${String(overlay?.width)}px;`);
    expect(overlay?.height).toBe(fontPx * lineHeight);
  });
});
