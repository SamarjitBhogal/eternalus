import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { accessibleNames, renderWithStore } from '../testStore';
import glyphStyles from './KeyGlyph.module.css';
import glyphCss from './KeyGlyph.module.css?raw';
import { KeyPrompt } from './KeyPrompt';
import styles from './KeyPrompt.module.css';
import promptCss from './KeyPrompt.module.css?raw';

/** The default chords of the two prompts' actions (game/input/keybindings.ts): C and Esc. */
const DEFAULT_BINDINGS: readonly Binding[] = [
  { action: 'gadget-2', chords: [{ device: 'keyboard', code: 'KeyC', label: 'C' }] },
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

const renderWith = (element: ReactElement, bindings: readonly Binding[]): string =>
  renderWithStore(element, {
    settings: { ...settingsSlice.getInitialState(), bindings },
  });

const noop = (): void => undefined;

describe('KeyPrompt', () => {
  it('shows the bound key in the cap, then the label, as one button', () => {
    const html = renderWith(
      <KeyPrompt action="gadget-2" label="View Details" onPress={noop} skin="view-details" />,
      DEFAULT_BINDINGS,
    );

    expect(html).toBe(
      `<button type="button" class="${String(styles.prompt)} ${String(styles.viewDetails)}">` +
        `<span class="${String(styles.cap)}"><kbd class="${String(glyphStyles.bare)}">C</kbd></span> ` +
        `<span class="${String(styles.label)}">View Details</span></button>`,
    );
    expect(accessibleNames(html, 'button')).toEqual(['C View Details']);
  });

  it('names Back from its cap and label (label in name, WCAG 2.5.3)', () => {
    const html = renderWith(
      <KeyPrompt action="pause-menu" label="back" onPress={noop} skin="legend-back" />,
      DEFAULT_BINDINGS,
    );

    expect(html).toContain(String(styles.legendBack));
    expect(accessibleNames(html, 'button')).toEqual(['Esc back']);
  });

  it('takes the focus on mount only when asked to', () => {
    const asked = renderWith(
      <KeyPrompt
        action="gadget-2"
        label="View Details"
        onPress={noop}
        skin="view-details"
        isAutoFocused
      />,
      DEFAULT_BINDINGS,
    );
    const unasked = renderWith(
      <KeyPrompt action="gadget-2" label="View Details" onPress={noop} skin="view-details" />,
      DEFAULT_BINDINGS,
    );

    expect(asked).toMatch(/^<button [^>]*autofocus=""[^>]*>/);
    expect(unasked).not.toContain('autofocus');
  });

  it('re-renders the cap when gadget-2 is rebound to X (13 §8)', () => {
    const html = renderWith(
      <KeyPrompt action="gadget-2" label="View Details" onPress={noop} skin="view-details" />,
      [{ action: 'gadget-2', chords: [{ device: 'keyboard', code: 'KeyX', label: 'X' }] }],
    );

    expect(html).toMatch(/<kbd[^>]*>X<\/kbd>/);
    expect(html).not.toMatch(/<kbd[^>]*>C<\/kbd>/);
    expect(accessibleNames(html, 'button')).toEqual(['X View Details']);
  });

  it('places each skin at its Figma node with its cap box (58:328, 62:84)', () => {
    expect(promptCss).toMatch(/\.legendBack \{\s*left: 73px;\s*top: 971px;\s*gap: 9px;/);
    expect(promptCss).toMatch(
      /\.legendBack \.cap \{\s*min-width: 40px;\s*height: 22px;\s*margin-top: 3px;\s*padding: 0 3px 1px 2px;/,
    );
    // The Figma's "esc " centres its glyphs; a rendered trailing space would widen the cap (58:328).
    expect(promptCss).not.toContain('::after');
    expect(promptCss).toMatch(/\.viewDetails \{\s*left: 83px;\s*top: 748px;\s*gap: 14px;/);
    expect(promptCss).toMatch(
      /\.viewDetails \.cap \{\s*min-width: 21px;\s*height: 21px;\s*margin-top: 5px;/,
    );
    // 62:88: the key label 1 px lower in its unchanged 21 px cap (measured on 62:70).
    expect(promptCss).toMatch(
      /\.viewDetails \.cap > kbd \{\s*position: relative;\s*top: 1px;\s*\}/,
    );
    expect(promptCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });

  // OD-21f: at 21 px the Esc <kbd> (which inherits the cap's font) scrolled 34 × 24 in a 34 × 21
  // box. Cinzel 20's line box is its Figma AUTO leading, the label's own `--leading-game-20`.
  it('gives the Back cap the 20 px game leading, so its key label never overflows its box', () => {
    const backCap = /\n\.legendBack \.cap \{([^}]*)\}/.exec(promptCss)?.[1] ?? 'missing';

    expect(backCap).toContain('line-height: calc(var(--leading-game-20) * 1px);');
    expect(backCap).not.toContain('line-height: 21px;');
    expect(glyphCss).toMatch(/\.bare \{\s*font: inherit;/);
  });
});
