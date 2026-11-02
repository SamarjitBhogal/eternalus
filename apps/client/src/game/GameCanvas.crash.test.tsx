// @vitest-environment happy-dom
// A page for this file only (DEC-111): server rendering runs no effects and no error boundaries.
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '../bridge/eventBus';
import { useAppSelector } from '../bridge/hooks';
import { sessionSlice } from '../bridge/slices/sessionSlice';
import { createAppStore } from '../bridge/store';
import type { ScreenProps } from '../ui/screens/screen.types';
import { App } from '../ui/App';
import { GameCanvas } from './GameCanvas';
import type { GameCanvasLabels } from './GameCanvas.types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A match screen that draws the viewport, then throws on a later render once an overlay opens. */
vi.mock('../ui/screens/MatchScreen', () => ({
  MatchScreen: ({ viewport }: ScreenProps): ReactElement => {
    const overlay = useAppSelector((state) => state.session.overlay);
    if (overlay !== null) throw new Error('match screen failed');
    return <main>{viewport}</main>;
  },
}));

const LABELS: GameCanvasLabels = {
  canvas: 'Battlefield',
  explorer: {
    canvas: 'Explore',
    hint: 'Hint',
    overview: 'Overview',
    restoreRoofs: 'Restore roofs',
    legend: { stronghold: (teamName) => `${teamName} stronghold`, camps: 'Camps' },
  },
};

let root: Root | undefined;
const order: string[] = [];
eventBus.on('ui-intent', (intent) => {
  if (intent.kind === 'report-screen-crash') order.push('report-screen-crash');
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = undefined;
  order.length = 0;
});

describe('a crash of the match screen, in real React', () => {
  it('reaches the session before the viewport detaches and the match is dropped (ADR 0025 §8)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const store = createAppStore({
      session: { ...sessionSlice.getInitialState(), phase: 'match' },
    });
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        <Provider store={store}>
          <App
            viewport={
              <GameCanvas
                attach={() => {
                  order.push('attach');
                  return () => order.push('detach');
                }}
                isExplorerShown={false}
                labels={LABELS}
                teamNames={{ light: 'Lux', dark: 'Umbra' }}
              />
            }
          />
        </Provider>,
      );
    });
    expect(order).toEqual(['attach']);

    act(() => {
      store.dispatch(sessionSlice.actions.overlayChanged('pause'));
    });

    expect(container.querySelector('main')).toBeNull();
    expect(order).toEqual(['attach', 'report-screen-crash', 'detach']);
  });
});
