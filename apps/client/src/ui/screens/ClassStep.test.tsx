import { describe, expect, it } from 'vitest';

import type { ClassSelectLayout } from '../../bridge/catalogue.types';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassStep } from './ClassStep';

const render = (classSelectLayout: ClassSelectLayout, preferredClassId: string | null): string =>
  renderWithStore(<ClassStep preferredClassId={preferredClassId} />, {
    content: { ...TEST_CONTENT, classSelectLayout },
  });

/** The `data-class-id` of every `role="radio"` card whose start tag carries `autofocus`. */
const autofocusedClassIds = (html: string): string[] =>
  (html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [])
    .filter((tag) => tag.includes('autofocus'))
    .map((tag) => /data-class-id="([^"]*)"/.exec(tag)?.[1] ?? '');

describe('ClassStep', () => {
  it("draws the primary layout's card row (62:125) for the primary catalogue", () => {
    const html = render('primary', null);

    expect(accessibleNames(html, '[role=radiogroup]')).toEqual(['Choose Your Class']);
    expect(html).not.toContain('View Details');
  });

  it('draws the alternate layout (O5, 62:70) for the alternate catalogue, and no card row', () => {
    const html = render('alternate', null);

    expect(html).toContain('View Details');
    expect(html).not.toContain('role="radiogroup"');
  });

  it('hands the class Back returned to on to the layout it draws (CD-11)', () => {
    expect(autofocusedClassIds(render('primary', 'sentinel'))).toEqual(['sentinel']);
    expect(autofocusedClassIds(render('primary', null))).toEqual([]);
  });
});
