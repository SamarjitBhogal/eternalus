// @vitest-environment happy-dom
// A page for this file only (DEC-111): the rest of the suite stays in Node.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';

import { loadedAssetsFor } from '../../bridge/__fixtures__/assetFixtures';
import type { Binding } from '../../bridge/Binding.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { createAppStore } from '../../bridge/store';
import { TEST_CONTENT } from '../testStore';
import { ClassSelectStep } from './ClassSelectStep';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The defaults for both keys (game/input/keybindings.ts): V View Details, Esc Back. */
const BINDINGS: readonly Binding[] = [
  { action: 'view-details', chords: [{ device: 'keyboard', code: 'KeyV', label: 'V' }] },
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

let root: Root | undefined;

/** Mounts the class step, Magus picked, in the page; returns its container. */
function mount(): HTMLElement {
  const store = createAppStore({
    content: TEST_CONTENT,
    assets: loadedAssetsFor(TEST_CONTENT),
    settings: { ...settingsSlice.getInitialState(), bindings: BINDINGS },
  });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Provider store={store}>
        <ClassSelectStep preferredClassId="magus" />
      </Provider>,
    );
  });
  return container;
}

/** A key press of `code` on the focused element, bubbling to `window` as the browser sends it. */
function press(code: string): void {
  const target = document.activeElement ?? document.body;
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
  });
}

const dialog = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>('[role="dialog"]');

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

// DEC-103: V opens View Details; only Esc closes it, and the focus goes back where it was (DEC-65).
describe('ClassSelectStep View Details, in a page', () => {
  it('opens on V with Esc Back focused, and Esc closes it and gives the focus back', () => {
    const container = mount();
    const card = container.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
    expect(card).not.toBeNull();
    card?.focus();
    expect(dialog(container)?.dataset.open).toBe('false');

    press('KeyV');

    expect(dialog(container)?.dataset.open).toBe('true');
    expect(dialog(container)?.hasAttribute('inert')).toBe(false);
    expect(document.activeElement?.textContent).toBe('Esc back');

    press('Escape');

    expect(dialog(container)?.dataset.open).toBe('false');
    expect(dialog(container)?.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(card);
  });

  it('opens from a click on the V View Details prompt too', () => {
    const container = mount();
    const prompt = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'V View Details',
    );
    expect(prompt).toBeDefined();

    act(() => {
      prompt?.click();
    });

    expect(dialog(container)?.dataset.open).toBe('true');
  });
});
