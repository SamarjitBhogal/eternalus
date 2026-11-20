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

/** Mounts the countdown with the switch on at each of `seconds` in turn, on one root. */
function mountAcross(seconds: readonly number[]): {
  readonly lines: readonly (string | null)[];
  readonly regionChanges: readonly string[];
} {
  const store = createAppStore({
    content: { ...TEST_CONTENT, uiEnhancements: ['countdown-urgency'] },
  });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const observer = new MutationObserver(() => undefined);
  observer.observe(container, { childList: true, subtree: true, characterData: true });
  const lines = seconds.map((value) => {
    act(() => {
      root?.render(
        <Provider store={store}>
          <Countdown remainingSeconds={value} label="Time left" hasUrgency />
        </Provider>,
      );
    });
    return container.querySelector('[aria-live="polite"]')?.textContent ?? null;
  });
  // A change a screen reader hears: text that reaches the region once the region is in the page.
  const regionChanges = observer
    .takeRecords()
    .filter((record) => record.target instanceof Element && record.target.matches('[aria-live]'))
    .map((record) => record.target.textContent ?? '');
  observer.disconnect();
  return { lines, regionChanges };
}

// The owner's answer of 2026-11-20 ("Countdown PR Calls", overlay-10s-line): the match-start
// overlay mounts at 10 s, and a live region that mounts already holding its line may never be
// read. The region is in the page empty first, so "10 seconds left" arrives as a change.
describe('Countdown screen-reader line (UE-01)', () => {
  it('says the line as a change when the countdown mounts at 10 s', () => {
    const { lines, regionChanges } = mountAcross([10]);

    expect(lines).toEqual([STRINGS.countdownAlert(10)]);
    expect(regionChanges).toEqual([STRINGS.countdownAlert(10)]);
  });

  it('says the line only at 10 and 5 s, in one region kept across the seconds', () => {
    const { lines } = mountAcross([42, 11, 10, 9, 6, 5, 4, 0]);

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
  });
});
