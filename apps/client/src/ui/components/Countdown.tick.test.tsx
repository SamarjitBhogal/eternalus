// @vitest-environment happy-dom
// A page for this file only (DEC-111): the tick restarts by remounting the numeral, which only a
// mounted tree shows.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';

import type { UiEnhancementId } from '../../bridge/catalogue.types';
import { createAppStore } from '../../bridge/store';
import { STRINGS } from '../strings';
import { TEST_CONTENT } from '../testStore';
import { Countdown } from './Countdown';
import { LiveRegion } from './LiveRegion';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

/** The numeral element after mounting at 7 s, then after the second changes to 6 s. */
function numeralsAcrossASecond(
  uiEnhancements: readonly UiEnhancementId[],
): readonly (Element | null)[] {
  const store = createAppStore({ content: { ...TEST_CONTENT, uiEnhancements } });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const show = (seconds: number): Element | null => {
    act(() => {
      root?.render(
        <Provider store={store}>
          <Countdown remainingSeconds={seconds} label="Time left" hasUrgency />
        </Provider>,
      );
    });
    return container.querySelector('[role="timer"]');
  };
  return [show(7), show(6)];
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

// ui-enhancements-plan §2 rule 4: time from data, `key={seconds}`, so each second change replays
// the one-cycle tick (1 Hz) with no timer in ui/.
describe('Countdown tick (UE-01)', () => {
  it('mounts a new numeral on each second change while the switch is on', () => {
    const [before, after] = numeralsAcrossASecond(['countdown-urgency']);

    expect(after?.textContent).toBe('6');
    expect(after).not.toBe(before);
  });

  it('keeps the one numeral with the switch off (the Figma original)', () => {
    const [before, after] = numeralsAcrossASecond([]);

    expect(after?.textContent).toBe('6');
    expect(after).toBe(before);
  });
});

/**
 * Mounts the app's `LiveRegion` alone, then the countdown inside it at each of `seconds` in turn,
 * the switch on: the region's text at each second, and whether every line went into the region
 * that was in the page before the countdown, the only live region on the page.
 */
function sayAcross(seconds: readonly number[]): {
  readonly lines: readonly string[];
  readonly isOneEarlierRegion: boolean;
} {
  const store = createAppStore({
    content: { ...TEST_CONTENT, uiEnhancements: ['countdown-urgency'] },
  });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const show = (value: number | null): void => {
    act(() => {
      root?.render(
        <Provider store={store}>
          <LiveRegion>
            {value !== null && <Countdown remainingSeconds={value} label="Time left" hasUrgency />}
          </LiveRegion>
        </Provider>,
      );
    });
  };
  show(null);
  const earlier = container.querySelector('[aria-live="polite"]');
  const wasEmptyBefore = earlier !== null && earlier.textContent === '';
  const regions: Element[] = [];
  const lines = seconds.map((value) => {
    show(value);
    regions.push(...container.querySelectorAll('[aria-live]'));
    return earlier?.textContent ?? 'no region';
  });
  return {
    lines,
    isOneEarlierRegion:
      wasEmptyBefore &&
      regions.length === seconds.length &&
      regions.every((region) => region === earlier),
  };
}

// The owner's answer of 2026-11-20 ("Countdown PR Calls", overlay-10s-line, DEC-282 (7)): a
// region that appears already holding its line may never be read. The line goes into the app's
// region, which was in the page, empty, before the countdown appeared.
describe('Countdown screen-reader line (UE-01)', () => {
  it('says the line in the region that was there before, when the countdown appears at 10 s', () => {
    const { lines, isOneEarlierRegion } = sayAcross([10]);

    expect(lines).toEqual([STRINGS.countdownAlert(10)]);
    expect(isOneEarlierRegion).toBe(true);
  });

  it('says the line only at 10 and 5 s, in that one region across the seconds', () => {
    const { lines, isOneEarlierRegion } = sayAcross([42, 11, 10, 9, 6, 5, 4, 0]);

    expect(lines).toEqual([
      '',
      '',
      STRINGS.countdownAlert(10),
      '',
      '',
      STRINGS.countdownAlert(5),
      '',
      '',
    ]);
    expect(isOneEarlierRegion).toBe(true);
  });
});
