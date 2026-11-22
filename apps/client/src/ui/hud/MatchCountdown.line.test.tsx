// @vitest-environment happy-dom
// A page for this file only (DEC-111): the line reaches the region through a portal and a store
// update, which only a mounted tree shows.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';

import { matchSlice } from '../../bridge/slices/matchSlice';
import { createAppStore } from '../../bridge/store';
import { LiveRegion } from '../components/LiveRegion';
import { STRINGS } from '../strings';
import { TEST_CONTENT } from '../testStore';
import { MatchCountdown } from './MatchCountdown';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

// DEC-282 (7), the owner's "the live region exists before the number": the overlay appears on a
// store update already at 10 s, so its line must go into the app's region, mounted with the app.
describe('MatchCountdown screen-reader line (UE-01)', () => {
  it('says 10 and 5 s in the region that was in the page before the overlay appeared', () => {
    const store = createAppStore({
      content: { ...TEST_CONTENT, uiEnhancements: ['countdown-urgency'] },
    });
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        <Provider store={store}>
          <LiveRegion>
            <MatchCountdown />
          </LiveRegion>
        </Provider>,
      );
    });
    const region = container.querySelector('[aria-live="polite"]');
    const before = region?.textContent;
    const lineAt = (countdown: number): readonly [string | null, number] => {
      act(() => {
        store.dispatch(matchSlice.actions.clockChanged({ tick: 0, seconds: 0, countdown }));
      });
      return [
        container.querySelector('[aria-live="polite"]') === region
          ? (region?.textContent ?? null)
          : null,
        container.querySelectorAll('[aria-live]').length,
      ];
    };

    expect(region).not.toBeNull();
    expect(before).toBe('');
    expect([10, 9, 5, 1].map(lineAt)).toEqual([
      [STRINGS.countdownAlert(10), 1],
      ['', 1],
      [STRINGS.countdownAlert(5), 1],
      ['', 1],
    ]);
  });
});
