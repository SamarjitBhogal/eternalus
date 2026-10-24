import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../../bridge/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { AetherBar } from './AetherBar';
import styles from './ResourceBar.module.css';

const numeral = (html: string) =>
  new RegExp(`<span class="${String(styles.value)}" aria-hidden="true">([^<]*)</span>`).exec(
    html,
  )?.[1];

describe('AetherBar', () => {
  it('shows the Figma aether 4700 of 5640 as the Aether meter with its numeral', () => {
    const html = renderWithStore(<AetherBar className="placed" />, {
      hud: { player: FIGMA_HUD_PLAYER, announcements: [] },
    });
    expect(numeral(html)).toBe('4700');
    expect(html).toContain('aria-valuetext="4700 of 5640"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Aether']);
    expect(html).toContain(`class="${String(styles.resource)} placed"`);
  });

  it('shows a dash and the no-data image before the first HUD publish, with no shield overlay', () => {
    const html = renderWithStore(<AetherBar />);
    expect(numeral(html)).toBe('—');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Aether: No data yet']);
    expect(html).not.toMatch(/shield/i);
  });
});
