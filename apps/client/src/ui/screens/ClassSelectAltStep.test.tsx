import { describe, expect, it } from 'vitest';

import { loadedAssetsFor } from '../../bridge/__fixtures__/assetFixtures';
import type { Binding } from '../../bridge/Binding.types';
import type { DisplayCatalogue, LegendClassCard } from '../../bridge/catalogue.types';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import glowStyles from '../components/GlowButton.module.css';
import detailsStyles from '../components/InfoPanelDetails.module.css';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassSelectAltStep } from './ClassSelectAltStep';
import styles from './ClassSelectAltStep.module.css';
import stripStyles from './ClassSelectLegendStrip.module.css';

/** The alternate layout with the Magus's 62:70 copy and flame icon (DEC-52). */
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

/** View Details' default key (game/input/keybindings.ts, DEC-103). */
const VIEW_DETAILS_ON_V: readonly Binding[] = [
  { action: 'view-details', chords: [{ device: 'keyboard', code: 'KeyV', label: 'V' }] },
];

/** The step's own markup, before the View Details screen it renders after its section. */
const stepPart = (html: string): string => html.slice(0, html.indexOf('role="dialog"'));
/** The View Details screen's markup. */
const detailsPart = (html: string): string => html.slice(html.indexOf('role="dialog"'));

const render = (preferredClassId: string | null): string =>
  renderWithStore(<ClassSelectAltStep preferredClassId={preferredClassId} />, {
    content: ALTERNATE,
    assets: loadedAssetsFor(ALTERNATE),
    settings: { ...settingsSlice.getInitialState(), bindings: VIEW_DETAILS_ON_V },
  });

/** The accessible name (text) of every button whose start tag carries `autofocus`. */
const autofocusedButtons = (html: string): string[] =>
  [...html.matchAll(/<button([^>]*)>(.*?)<\/button>/g)]
    .filter(([, attributes = '']) => attributes.includes('autofocus'))
    .map(([, , inner = '']) => inner.replace(/<[^>]+>/g, '').trim());

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
    // 62:70 has no role line; the shared View Details screen (DEC-109) keeps the primary one.
    expect(stepPart(html)).not.toContain('Aether  ·  Ranged Support');
    expect(detailsPart(html)).toContain('Aether  ·  Ranged Support');
  });

  it('announces the panel title politely, since the arrows change it without a focus move', () => {
    expect(render('magus')).toMatch(/<h3[^>]*aria-live="polite"[^>]*>Magus<\/h3>/);
  });

  it('shows the first available class with nothing picked, its card art standing in for a model', () => {
    const html = render(null);

    expect(html).toContain('>Vanguard</h3>');
    expect(imgTag(html, '/assets/test/warrior-card-art.webp')).toContain(
      `class="${String(styles.modelStandIn)}"`,
    );
    expect(html).not.toContain('magus-model');
  });

  it('after Back, gives the focus to View Details (CD-11)', () => {
    expect(autofocusedButtons(render('magus'))).toEqual(['V View Details']);
  });

  it('focuses nothing on first entry (62:70 shows no focus ring)', () => {
    expect(autofocusedButtons(render(null))).toEqual([]);
  });

  // DEC-109: View Details only opens the details screen; Select Class selects.
  it('has the arrows, View Details with its live key and Select Class, and no cards or roster', () => {
    const html = stepPart(render(null));

    expect(accessibleNames(html, 'button')).toEqual([
      'Previous class',
      'Next class',
      'V View Details',
      'Select Class',
    ]);
    expect(html).not.toMatch(/role="radio"|<ul[^>]*aria-label=/);
    expect(accessibleNames(html, 'section')).toEqual(['Choose Your Class']);
  });

  it("enables Select Class for the shown class, at the primary layout's place with live chrome", () => {
    const html = stepPart(render(null));

    expect(html).toMatch(
      new RegExp(
        `<button type="button" class="${String(glowStyles.button)} ${String(glowStyles.selectClass)}">`,
      ),
    );
    expect(html).not.toContain(`class="${String(glowStyles.chrome)}"`);
  });

  // DEC-109: "Similar screens for both": V opens the same class details screen as the primary layout.
  it("opens the shown class's details screen with V, closed and inert until opened", () => {
    const html = render('magus');
    const details = detailsPart(html);
    const labels = [
      ...details.matchAll(new RegExp(`class="${String(detailsStyles.label)}">([^<]+)<`, 'g')),
    ].map(([, label]) => label);

    expect(stepPart(html)).not.toMatch(/<section[^>]*inert/);
    expect(details).toMatch(
      /^role="dialog" aria-modal="true" aria-label="View Details" data-open="false" data-reduce-motion="false" inert=""/,
    );
    expect(details).toContain('data-layout="class-details"');
    expect(details).toContain('>Magus</h3>');
    expect(labels).toEqual(['Default ability', 'Weapon Proficiency', 'Specialty']);
    expect(details).toContain(
      `<div class="${String(stripStyles.strip)}" data-placement="view-details">`,
    );
  });
});
