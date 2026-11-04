// @vitest-environment happy-dom
// A page for this file only (DEC-111): server rendering does not run error boundaries.
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { ErrorBoundary } from './ErrorBoundary';

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

/** A screen that throws `value` when it renders. */
function Broken({ value }: { readonly value: unknown }): ReactElement {
  // The tests throw non-Errors on purpose: React lets a component throw anything.
  throw value;
}

function mount(element: ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  // React logs a caught render error to the console; the test keeps its output clean.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  act(() => {
    root?.render(element);
  });
  return container;
}

describe('ErrorBoundary', () => {
  it('shows its children while nothing throws', () => {
    const container = mount(
      <ErrorBoundary screen="match">
        <p>fine</p>
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe('fine');
    expect(intents).toEqual([]);
  });

  it('shows an empty screen and emits one report-screen-crash with plain strings', () => {
    const error = new Error('render failed');
    const container = mount(
      <ErrorBoundary screen="menu.settings">
        <Broken value={error} />
      </ErrorBoundary>,
    );

    expect(container.innerHTML).toBe('');
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      kind: 'report-screen-crash',
      screen: 'menu.settings',
      message: 'render failed',
      stack: error.stack,
    });
    const [crash] = intents;
    expect(crash?.kind === 'report-screen-crash' ? crash.componentStack : '').toContain('Broken');
  });

  it('sends the thrown value as text when it is not an Error', () => {
    mount(
      <ErrorBoundary screen="boot">
        <Broken value="plain text" />
      </ErrorBoundary>,
    );

    expect(intents).toEqual([expect.objectContaining({ message: 'plain text', stack: '' })]);
  });

  it('keeps the fallback and emits no second intent when the same screen renders again', () => {
    const container = mount(
      <ErrorBoundary screen="match">
        <Broken value={new Error('first')} />
      </ErrorBoundary>,
    );

    act(() => {
      root?.render(
        <ErrorBoundary screen="match">
          <Broken value={new Error('second')} />
        </ErrorBoundary>,
      );
    });

    expect(container.innerHTML).toBe('');
    expect(intents).toHaveLength(1);
  });

  it('starts fresh under a new key: another screen can crash and report', () => {
    mount(
      <ErrorBoundary key="a" screen="a">
        <Broken value={new Error('first')} />
      </ErrorBoundary>,
    );

    act(() => {
      root?.render(
        <ErrorBoundary key="b" screen="b">
          <Broken value={new Error('second')} />
        </ErrorBoundary>,
      );
    });

    expect(
      intents.map((intent) => (intent.kind === 'report-screen-crash' ? intent.screen : '')),
    ).toEqual(['a', 'b']);
  });
});
