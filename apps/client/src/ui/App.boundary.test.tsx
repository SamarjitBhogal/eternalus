// @vitest-environment happy-dom
// A page for this file only (DEC-111): server rendering does not run error boundaries.
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '../bridge/eventBus';
import type { UiIntent } from '../bridge/events';
import { sessionSlice } from '../bridge/slices/sessionSlice';
import { createAppStore } from '../bridge/store';
import { App } from './App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The home screen throws; the other screens are not the one under test.
vi.mock('./screens/MainMenuScreen', () => ({
  MainMenuScreen: (): ReactElement => {
    throw new Error('home failed');
  },
}));
vi.mock('./screens/AboutScreen', () => ({
  AboutScreen: (): ReactElement => <p>about screen</p>,
}));

let root: Root | undefined;
const intents: UiIntent[] = [];
eventBus.on('ui-intent', (intent) => intents.push(intent));

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = undefined;
  intents.length = 0;
});

describe('App with a crashing screen', () => {
  it('shows an empty screen and reports it by phase and route, then recovers on another route', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = createAppStore({
      session: { ...sessionSlice.getInitialState(), phase: 'menu' },
    });
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        <Provider store={store}>
          <App />
        </Provider>,
      );
    });

    expect(container.querySelector('main')).toBeNull();
    expect(intents).toEqual([
      expect.objectContaining({ kind: 'report-screen-crash', screen: 'menu.home' }),
    ]);

    act(() => {
      store.dispatch(sessionSlice.actions.routeChanged('about'));
    });

    expect(container.textContent).toBe('about screen');
    expect(intents).toHaveLength(1);
  });
});
