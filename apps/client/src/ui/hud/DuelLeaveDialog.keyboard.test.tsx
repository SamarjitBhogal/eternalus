// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { sessionSlice } from '../../bridge/slices/sessionSlice';
import { createAppStore } from '../../bridge/store';
import { DuelLeaveDialog } from './DuelLeaveDialog';

describe('DuelLeaveDialog by keyboard alone', () => {
  it('Tab moves the focus from Stay to Leave, then Enter emits forfeit', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const store = createAppStore();
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const intents: UiIntent[] = [];
    const off = eventBus.on('ui-intent', (intent) => intents.push(intent));
    act(() => {
      root.render(
        <Provider store={store}>
          <DuelLeaveDialog />
        </Provider>,
      );
    });
    act(() => {
      store.dispatch(sessionSlice.actions.overlayChanged('leave-duel'));
    });
    const [stay, leave] = [...container.querySelectorAll('button')];
    if (stay === undefined || leave === undefined) throw new Error('no buttons');
    stay.focus();
    const press = (code: string): void => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }),
      );
    };
    act(() => {
      press('Tab');
    });
    expect(document.activeElement).toBe(leave);
    act(() => {
      press('Enter');
    });
    expect(intents).toEqual([{ kind: 'forfeit' }]);
    off();
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
