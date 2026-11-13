// @vitest-environment happy-dom
// A page for this file only (DEC-111): clicks and typing need real elements.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { developerMenuSlice } from '../../bridge/slices/developerMenuSlice';
import { createAppStore } from '../../bridge/store';
import { TEST_CONTENT } from '../testStore';
import { DeveloperMenu } from './DeveloperMenu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

/** Mounts the open menu; returns the container and every `dev-command` it emits. */
function mount() {
  const store = createAppStore({
    content: TEST_CONTENT,
    developerMenu: {
      ...developerMenuSlice.getInitialState(),
      isOpen: true,
      mobs: [
        { id: 'light-minion', label: 'Light Minion' },
        { id: 'heavy-minion', label: 'Heavy Minion' },
      ],
      origins: [
        { id: 'gate-a', label: 'gate-a' },
        { id: 'gate-b', label: 'gate-b' },
      ],
    },
  });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Provider store={store}>
        <DeveloperMenu />
      </Provider>,
    );
  });
  const intents: UiIntent[] = [];
  const stop = eventBus.on('ui-intent', (intent) => intents.push(intent));
  return { container, intents, stop };
}

/** The labelled form control `label` names. */
function field(container: HTMLElement, label: string): HTMLElement {
  const text = [...container.querySelectorAll('label')].find((l) => l.textContent === label);
  const target =
    text === undefined
      ? null
      : container.querySelector<HTMLElement>(`#${CSS.escape(text.htmlFor)}`);
  if (target === null) throw new Error(`No field "${label}"`);
  return target;
}

/** Picks `value` in the select `label` names, as a user does. */
function pick(container: HTMLElement, label: string, value: string): void {
  const select = field(container, label);
  if (!(select instanceof HTMLSelectElement)) throw new Error(`"${label}" is not a select`);
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

/** Types `value` in the input `label` names; the native setter gets past React's value tracker. */
function type(container: HTMLElement, label: string, value: string): void {
  const input = field(container, label);
  if (!(input instanceof HTMLInputElement)) throw new Error(`"${label}" is not an input`);
  // eslint-disable-next-line @typescript-eslint/unbound-method -- called with `.call(input, ...)` below
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setValue?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const click = (container: HTMLElement, name: string): void => {
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent === name);
  act(() => {
    button?.click();
  });
};

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

describe('DeveloperMenu buttons', () => {
  it('Spawn sends exactly one dev-spawn-mobs with the chosen team, mob, count and origin', () => {
    const { container, intents, stop } = mount();
    pick(container, 'Team', 'dark');
    pick(container, 'Mob', 'heavy-minion');
    type(container, 'Count', '12');
    pick(container, 'Origin', 'gate-b');
    click(container, 'Spawn');
    stop();
    expect(intents).toEqual([
      {
        kind: 'dev-command',
        command: {
          type: 'dev-spawn-mobs',
          team: 'dark',
          definitionId: 'heavy-minion',
          count: 12,
          origin: { kind: 'structure', structureId: 'gate-b' },
        },
      },
    ]);
  });

  it('Spawn with no edits sends the first mob and origin for the light team', () => {
    const { container, intents, stop } = mount();
    click(container, 'Spawn');
    stop();
    expect(intents).toEqual([
      {
        kind: 'dev-command',
        command: {
          type: 'dev-spawn-mobs',
          team: 'light',
          definitionId: 'light-minion',
          count: 5,
          origin: { kind: 'structure', structureId: 'gate-a' },
        },
      },
    ]);
  });

  it('Spawn is disabled for a count that is empty, zero, negative or not whole', () => {
    const { container, intents, stop } = mount();
    for (const bad of ['', '0', '-3', '2.5']) {
      type(container, 'Count', bad);
      click(container, 'Spawn');
    }
    stop();
    expect(intents).toEqual([]);
  });

  it('Remove sends exactly one dev-remove-entity with the typed id, and nothing without one', () => {
    const { container, intents, stop } = mount();
    click(container, 'Remove');
    expect(intents).toEqual([]);
    type(container, 'Entity id', ' e42 ');
    click(container, 'Remove');
    stop();
    expect(intents).toEqual([
      { kind: 'dev-command', command: { type: 'dev-remove-entity', entityId: 'e42' } },
    ]);
  });

  it('Add sends exactly one dev-spawn-legend with the chosen team and class', () => {
    const { container, intents, stop } = mount();
    pick(container, 'Team', 'dark');
    pick(container, 'Class', 'sentinel');
    click(container, 'Add');
    stop();
    expect(intents).toEqual([
      {
        kind: 'dev-command',
        command: { type: 'dev-spawn-legend', team: 'dark', definitionId: 'sentinel' },
      },
    ]);
  });

  it('Add with no edits sends the first selectable class for the light team, never the locked one', () => {
    const { container, intents, stop } = mount();
    expect([...field(container, 'Class').querySelectorAll('option')].map((o) => o.value)).toEqual([
      'warrior',
      'sentinel',
      'magus',
    ]);
    click(container, 'Add');
    stop();
    expect(intents).toEqual([
      {
        kind: 'dev-command',
        command: { type: 'dev-spawn-legend', team: 'light', definitionId: 'warrior' },
      },
    ]);
  });
});
