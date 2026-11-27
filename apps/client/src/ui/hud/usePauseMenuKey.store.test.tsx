// @vitest-environment happy-dom
import { act, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { hudSlice } from '../../bridge/slices/hudSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { createAppStore } from '../../bridge/store';
import { HUD_BINDINGS, settingsWith } from './hudTestSupport';
import { type PauseOpenerRef, usePauseMenuKey } from './usePauseMenuKey';

/** A component that only holds the pause key, with no overlay open, as `MatchScreen` does. */
function PauseKeyProbe({ openerRef }: { readonly openerRef: PauseOpenerRef }): ReactElement {
  usePauseMenuKey(null, openerRef);
  return <span>probe</span>;
}

describe('usePauseMenuKey reads the aim and the Duel from the store at press time', () => {
  it('in an online Duel, Esc first cancels the aim, then opens the leave confirmation', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const store = createAppStore({
      settings: settingsWith(HUD_BINDINGS),
      matchSetup: { ...matchSetupSlice.getInitialState(), mode: 'duel' },
    });
    store.dispatch(hudSlice.actions.aimingSlotChanged('ability-2'));
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const intents: UiIntent[] = [];
    const off = eventBus.on('ui-intent', (intent) => intents.push(intent));
    act(() => {
      root.render(
        <Provider store={store}>
          <PauseKeyProbe openerRef={{ current: null }} />
        </Provider>,
      );
    });
    const pressEscape = (): void => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', cancelable: true }));
    };

    pressEscape();
    store.dispatch(hudSlice.actions.aimingSlotChanged(null));
    pressEscape();

    expect(intents).toEqual([
      { kind: 'cancel-aim' },
      { kind: 'open-overlay', overlay: 'leave-duel' },
    ]);
    off();
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
