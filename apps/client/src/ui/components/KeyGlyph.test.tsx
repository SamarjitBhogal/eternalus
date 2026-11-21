import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { createAppStore } from '../../bridge/store';
import { KeyGlyph } from './KeyGlyph';
import styles from './KeyGlyph.module.css';
import css from './KeyGlyph.module.css?raw';

/** The declarations of the `.hud` rule in the module's CSS text. */
const hudRule = (): string => /(?:^|\n)\.hud \{([^}]*)\}/.exec(css)?.[1] ?? '';

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

  it('draws the inline key cap by default and the bare and HUD looks on request', () => {
    const store = storeWith(W_BINDINGS);
    const glyph = (appearance: 'inline' | 'bare' | 'hud') =>
      render(<KeyGlyph action="move-up" appearance={appearance} />, store);
    const byDefault = render(<KeyGlyph action="move-up" />, store);

    expect(styles.glyph).toBeTruthy();
    expect(byDefault).toBe(`<kbd class="${String(styles.glyph)}">W</kbd>`);
    expect(glyph('inline')).toBe(byDefault);
    expect(glyph('bare')).toBe(`<kbd class="${String(styles.bare)}">W</kbd>`);
    expect(glyph('hud')).toBe(`<kbd class="${String(styles.hud)}">W</kbd>`);
    expect(new Set([styles.glyph, styles.bare, styles.hud]).size).toBe(3);
  });

  it('centres the HUD key label on the Figma text node 65:668 (+13, +13 of the 25 × 25 box)', () => {
    const rule = hudRule();

    expect(rule).toContain('height: calc(25 * var(--hud-u));');
    expect(rule).toContain('border: calc(1 * var(--hud-u)) solid var(--hud-cream);');
    expect(rule).toContain(
      'padding: calc(1 * var(--hud-u)) calc(2 * var(--hud-u)) 0 calc(3 * var(--hud-u));',
    );
    expect(rule).toContain('line-height: calc(22 * var(--hud-u));');
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
