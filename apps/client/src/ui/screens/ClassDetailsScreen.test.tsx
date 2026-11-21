import { describe, expect, it } from 'vitest';

import { classCardFixture } from '../../bridge/__fixtures__/catalogueFixtures';
import type { Binding } from '../../bridge/Binding.types';
import type { ClassPanel } from '../../bridge/selectors/selectClassPanel';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { accessibleNames, renderWithStore } from '../testStore';
import { ClassDetailsScreen } from './ClassDetailsScreen';
import stripStyles from './ClassSelectLegendStrip.module.css';

const ESC: readonly Binding[] = [
  { action: 'pause-menu', chords: [{ device: 'keyboard', code: 'Escape', label: 'Esc' }] },
];

const PANEL: ClassPanel = {
  card: classCardFixture({ classId: 'magus', displayName: 'Magus', tagline: 'Aether' }),
  description: 'With a mastery of Aether, the Magus bends reality.',
  details: [],
  legendStrip: [{ key: 'oracle', name: 'Elarion', miniAssetId: null }],
};

const render = (isOpen: boolean): string =>
  renderWithStore(<ClassDetailsScreen panel={PANEL} isOpen={isOpen} onClose={() => undefined} />, {
    settings: { ...settingsSlice.getInitialState(), bindings: ESC },
  });

describe('ClassDetailsScreen', () => {
  // DEC-103: the class panel and its Legends strip, laid out again in View Details.
  it('shows the class title, role line, description and Legends strip while open', () => {
    const html = render(true);

    expect(html).toContain('data-open="true"');
    expect(html).toContain('data-layout="class-details"');
    expect(html).toContain('>Magus</h3>');
    expect(html).toContain('>Aether<');
    expect(html).toContain('With a mastery of Aether, the Magus bends reality.');
    expect(html).toContain(
      `<div class="${String(stripStyles.strip)}" data-placement="view-details">`,
    );
    expect(html).toContain('>Elarion<');
  });

  // DEC-109: View Details never selects; Esc Back is its only control and takes the focus.
  it('offers only Esc Back, autofocused, and no way to select the class', () => {
    const html = render(true);

    expect(accessibleNames(html, 'button')).toEqual(['Esc back']);
    expect(html).toMatch(/<button [^>]*autofocus=""/);
  });

  it('is inert with no control while closed', () => {
    const html = render(false);

    expect(html).toMatch(/data-open="false"[^>]*inert=""/);
    expect(accessibleNames(html, 'button')).toEqual([]);
  });
});
