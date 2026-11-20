// @vitest-environment happy-dom
// A page for this file only (DEC-111): the rest of the suite stays in Node.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { createAppStore } from '../../bridge/store';
import { STRINGS } from '../strings';
import { DuelNameScreen } from './DuelNameScreen';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

function mount() {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Provider store={createAppStore()}>
        <DuelNameScreen />
      </Provider>,
    );
  });
  const input = container.querySelector('input');
  const button = (name: string): HTMLButtonElement | undefined =>
    [...container.querySelectorAll('button')].find((element) => element.textContent === name);
  return { input, button };
}

function type(field: HTMLInputElement | null | undefined, value: string): void {
  act(() => {
    // React tracks a field's value through its own setter, so the test types through the
    // prototype's, as a keystroke does.
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called with `this` set below.
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setValue?.call(field, value);
    field?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('DuelNameScreen', () => {
  it('joins the Duel queue with the typed name', () => {
    const { input, button } = mount();
    type(input, 'Ana Maria');

    act(() => {
      button(STRINGS.duelName.find)?.click();
    });

    expect(intents).toEqual([{ kind: 'start-duel', name: 'Ana Maria' }]);
  });

  it.each(['', ' ', '<b>'])('does not let %j join', (name) => {
    const { input, button } = mount();
    type(input, name);

    expect(button(STRINGS.duelName.find)?.disabled).toBe(true);
  });

  it('goes back home', () => {
    const { button } = mount();

    act(() => {
      button(STRINGS.duelName.back)?.click();
    });

    expect(intents).toEqual([{ kind: 'navigate', route: 'home' }]);
  });
});
