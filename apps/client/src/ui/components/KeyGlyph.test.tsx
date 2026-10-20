import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { createAppStore } from '../../bridge/store';
import { KeyGlyph } from './KeyGlyph';

const W_BINDINGS: readonly Binding[] = [
  { action: 'move-up', chords: [{ device: 'keyboard', code: 'KeyW', label: 'W' }] },
  { action: 'gadget-1', chords: [{ device: 'keyboard', code: 'KeyZ', label: 'Z' }] },
];

function storeWith(bindings: readonly Binding[]): ReturnType<typeof createAppStore> {
  const store = createAppStore();
  store.dispatch(
    settingsSlice.actions.settingsChanged({ ...settingsSlice.getInitialState(), bindings }),
  );
  return store;
}

function render(element: ReactElement, store: ReturnType<typeof createAppStore>): string {
  return renderToStaticMarkup(<Provider store={store}>{element}</Provider>);
}

describe('KeyGlyph', () => {
  it('shows the label of the key bound to the action', () => {
    const html = render(<KeyGlyph action="move-up" />, storeWith(W_BINDINGS));

    expect(html).toMatch(/<kbd[^>]*>W<\/kbd>/);
  });

  it('shows a dash for an unbound action', () => {
    const html = render(<KeyGlyph action="sprint" />, storeWith(W_BINDINGS));

    expect(html).toMatch(/<kbd[^>]*>—<\/kbd>/);
  });

  it('updates every glyph when move-up is rebound from W to ArrowUp', () => {
    const store = storeWith(W_BINDINGS);
    const glyphs = (
      <>
        <KeyGlyph action="move-up" />
        <KeyGlyph action="move-up" />
        <KeyGlyph action="gadget-1" />
      </>
    );
    const before = render(glyphs, store);

    store.dispatch(
      settingsSlice.actions.settingsChanged({
        ...store.getState().settings,
        bindings: [
          { action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] },
          ...W_BINDINGS.slice(1),
        ],
      }),
    );
    const after = render(glyphs, store);

    expect(before.match(/>W</g)).toHaveLength(2);
    expect(after.match(/>↑</g)).toHaveLength(2);
    expect(after).not.toContain('>W<');
    expect(after).toContain('>Z<');
  });
});
