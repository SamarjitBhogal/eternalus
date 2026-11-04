import { describe, expect, it } from 'vitest';

import { accessibleNames, renderWithStore } from '../testStore';
import { ClassSelectAltArrow } from './ClassSelectAltArrow';
import arrowCss from './ClassSelectAltArrow.module.css?raw';

const render = (direction: 'previous' | 'next'): string =>
  renderWithStore(<ClassSelectAltArrow direction={direction} onPress={() => undefined} />);

describe('ClassSelectAltArrow', () => {
  it('is a named button per direction (CD-10)', () => {
    expect(accessibleNames(render('previous'), 'button')).toEqual(['Previous class']);
    expect(accessibleNames(render('next'), 'button')).toEqual(['Next class']);
    expect(render('next')).toMatch(/^<button type="button"[^>]*data-direction="next"/);
  });

  it('draws its chevron inline, hidden from assistive technology, in the text colour', () => {
    const html = render('previous');

    expect(html).toMatch(
      /<svg[^>]*viewBox="0 0 1 1" aria-hidden="true" focusable="false"><path d="/,
    );
    expect(arrowCss).toMatch(/\.chevron path \{[^}]*stroke: currentColor;/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
  });

  it('sits centred in the hidden 62:115 arrow spans, mirrored for previous', () => {
    expect(arrowCss).toMatch(/\[data-direction='previous'\] \{\s*left: 818\.5px;/);
    expect(arrowCss).toMatch(/\[data-direction='next'\] \{\s*left: 1186\.5px;/);
    expect(arrowCss).toMatch(/\[data-direction='previous'\] \.chevron \{\s*scale: -1 1;/);
  });
});
