import { describe, expect, it } from 'vitest';

import type { ClassSelectLayout } from '../../bridge/catalogue.types';
import promptStyles from '../components/KeyPrompt.module.css';
import { accessibleNames, autofocusedClassIds, renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassStep } from './ClassStep';

const render = (classSelectLayout: ClassSelectLayout, preferredClassId: string | null): string =>
  renderWithStore(<ClassStep preferredClassId={preferredClassId} />, {
    content: { ...TEST_CONTENT, classSelectLayout },
  });

describe('ClassStep', () => {
  it("draws the primary layout's card row (62:125) for the primary catalogue", () => {
    const html = render('primary', null);

    expect(accessibleNames(html, '[role=radiogroup]')).toEqual(['Choose Your Class']);
    // DEC-103: the V prompt of View Details, not the alternate layout's 62:84 prompt.
    expect(html).toContain(String(promptStyles.classViewDetails));
    expect(html).not.toContain(String(promptStyles.viewDetails));
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
