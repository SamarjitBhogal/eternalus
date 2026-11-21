import { describe, expect, it } from 'vitest';

import { contentSlice } from '../../bridge/slices/contentSlice';
import { matchSlice } from '../../bridge/slices/matchSlice';
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
    const duelHud = { ownKills: 0, opponentKills: 0, killTarget: 10, countdown: null };
    const html = renderWithStore(<CrystalStatus />, {
      match: { ...matchSlice.getInitialState(), duelHud },
    });
    expect(html).toBe('');
  });
});
