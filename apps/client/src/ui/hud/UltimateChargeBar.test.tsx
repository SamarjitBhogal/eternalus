import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { UltimateChargeBar } from './UltimateChargeBar';

describe('UltimateChargeBar', () => {
  it('shows the ultimate charge 5/6 as a meter at 83 %', () => {
    const html = renderWithStore(<UltimateChargeBar />, {
      hud: { player: FIGMA_HUD_PLAYER, announcements: [] },
    });
    expect(html).toContain('aria-valuenow="83"');
    expect(html).toContain('style="--segmented-bar-fill:50%"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Ultimate charge']);
  });

  it('is an image "No data yet" before the first publish', () => {
    const html = renderWithStore(<UltimateChargeBar />);
    expect(accessibleNames(html, '[role=img]')).toEqual(['Ultimate charge: No data yet']);
  });
});
