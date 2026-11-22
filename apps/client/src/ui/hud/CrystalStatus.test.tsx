import { describe, expect, it } from 'vitest';

import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSetupSlice } from '../../bridge/slices/matchSetupSlice';
import { renderWithStore } from '../testStore';
import { CrystalStatus } from './CrystalStatus';

describe('CrystalStatus', () => {
  it('always draws the crystal raster, hidden from assistive technology', () => {
    const html = renderWithStore(<CrystalStatus />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('src="/assets/test/objective-crystal.webp"');
  });

  it('keeps its box but draws no image before the HUD chrome is in the catalogue', () => {
    const html = renderWithStore(<CrystalStatus />, { content: contentSlice.getInitialState() });
    expect(html).not.toContain('<img');
  });

  it('draws no crystal in a Duel, which has no Cathedral crystal (SCRUM-447)', () => {
    const html = renderWithStore(<CrystalStatus />, {
      matchSetup: { ...matchSetupSlice.getInitialState(), mode: 'duel' },
    });
    expect(html).toBe('');
  });
});
