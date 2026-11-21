import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { LockGlyph } from './LockGlyph';
import styles from './LockGlyph.module.css';
import glyphCss from './LockGlyph.module.css?raw';

describe('LockGlyph', () => {
  it('draws a decorative padlock, hidden from assistive technology', () => {
    const html = renderWithStore(<LockGlyph />);

    expect(html).toMatch(
      new RegExp(
        `^<svg class="${String(styles.glyph)}" viewBox="0 0 16 20" aria-hidden="true" focusable="false"><path [^>]*></path><rect [^>]*></rect></svg>$`,
      ),
    );
  });

  it('adds the caller class beside its own', () => {
    expect(renderWithStore(<LockGlyph className="footerLock" />)).toContain(
      `class="${String(styles.glyph)} footerLock"`,
    );
  });

  it('paints in the surrounding text colour, never a literal', () => {
    expect(glyphCss.match(/currentColor/g)).toHaveLength(2);
    expect(glyphCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    expect(renderWithStore(<LockGlyph />)).not.toMatch(/fill="|stroke="|#[0-9a-fA-F]{3}/);
  });
});
