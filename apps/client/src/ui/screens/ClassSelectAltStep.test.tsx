import { describe, expect, it } from 'vitest';

import { loadedAssetsFor } from '../../bridge/assetFixtures';
import type { Binding } from '../../bridge/Binding.types';
import type { DisplayCatalogue, LegendClassCard } from '../../bridge/catalogue.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassSelectAltStep } from './ClassSelectAltStep';
import styles from './ClassSelectAltStep.module.css';

/** The alternate layout with the Magus's 62:70 copy and flame icon (BCA-27). */
const ALTERNATE: DisplayCatalogue = {
  ...TEST_CONTENT,
  classSelectLayout: 'alternate',
  legendClasses: TEST_CONTENT.legendClasses.map((card): LegendClassCard =>
    card.classId === 'magus'
      ? {
          ...card,
          layoutOverrides: {
            alternate: {
              description: 'The masters of Aether, Magus focus on the use of \nabilities.',
              details: card.details.map((row) =>
                row.slot === 'specialty'
                  ? { ...row, iconAssetId: 'magus-detail-arcane-intellect-flame' }
                  : row,
              ),
            },
          },
        }
      : card,
  ),
};

/** The default `gadget-2` binding (View Details, F7). */
const VIEW_DETAILS_ON_C: readonly Binding[] = [
  { action: 'gadget-2', chords: [{ device: 'keyboard', code: 'KeyC', label: 'C' }] },
];

const render = (preferredClassId: string | null): string =>
  renderWithStore(<ClassSelectAltStep preferredClassId={preferredClassId} />, {
    content: ALTERNATE,
    assets: loadedAssetsFor(ALTERNATE),
    settings: { ...settingsSlice.getInitialState(), bindings: VIEW_DETAILS_ON_C },
  });

/** The `<img>` start tag whose `src` is `url`. */
const imgTag = (html: string, url: string): string =>
  new RegExp(`<img src="${url.replace(/[.]/g, '\\.')}"[^>]*>`).exec(html)?.[0] ?? '';

describe('ClassSelectAltStep', () => {
  it("shows the Magus's model and the 62:70 panel copy and icons", () => {
    const html = render('magus');

    expect(imgTag(html, '/assets/test/magus-model.webp')).toContain(
      `class="${String(styles.model)}"`,
    );
    expect(html).toContain('>Magus</h3>');
    expect(html).toContain('The masters of Aether, Magus focus on the use of \nabilities.');
    expect(html).toContain('magus-detail-arcane-intellect-flame@detail-class-alt.webp');
    expect(html).toContain('Signature / Proficiency / Specialty');
    expect(html).not.toContain('Aether  ·  Ranged Support');
  });

  it('announces the panel title politely, since the arrows change it without a focus move', () => {
    expect(render('magus')).toMatch(/<h3[^>]*aria-live="polite"[^>]*>Magus<\/h3>/);
  });

  it('shows the first available class with nothing picked, its card art standing in for a model', () => {
    const html = render(null);

    expect(html).toContain('>Legionnaire</h3>');
    expect(imgTag(html, '/assets/test/warrior-card-art.webp')).toContain(
      `class="${String(styles.modelStandIn)}"`,
    );
    expect(html).not.toContain('magus-model');
  });

  it('has the arrows and View Details with its live key, and no cards, roster or Select Class', () => {
    const html = render(null);

    expect(accessibleNames(html, 'button')).toEqual([
      'Previous class',
      'Next class',
      'C View Details',
    ]);
    expect(html).not.toMatch(/role="radio"|Select Class|<ul[^>]*aria-label=/);
    expect(accessibleNames(html, 'section')).toEqual(['Choose Your Class']);
  });
});
