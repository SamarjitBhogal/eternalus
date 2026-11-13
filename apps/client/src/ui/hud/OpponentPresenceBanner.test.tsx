// @vitest-environment happy-dom
import { act } from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAppStore } from '../../bridge/store';
import { matchSlice } from '../../bridge/slices/matchSlice';
import { STRINGS } from '../strings';
import { OpponentPresenceBanner } from './OpponentPresenceBanner';

describe('OpponentPresenceBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down while the opponent is away and hides when they return', () => {
    const store = createAppStore();
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <Provider store={store}>
          <OpponentPresenceBanner />
        </Provider>,
      );
    });
    expect(container.textContent).toBe('');
    act(() => {
      store.dispatch(matchSlice.actions.opponentPresenceChanged(10_000));
    });
    expect(container.textContent).toBe(STRINGS.duelOpponent.lostConnection(10));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(container.textContent).toBe(STRINGS.duelOpponent.lostConnection(6));
    act(() => {
      store.dispatch(matchSlice.actions.opponentPresenceChanged(null));
    });
    expect(container.textContent).toBe('');
    act(() => {
      root.unmount();
    });
  });
});
