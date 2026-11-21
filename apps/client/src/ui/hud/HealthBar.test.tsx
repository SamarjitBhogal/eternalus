import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { HealthBar } from './HealthBar';
import { resourceNumeral as numeral } from './hudTestSupport';
import styles from './ResourceBar.module.css';

describe('HealthBar', () => {
  it('shows the Figma health 1850 of 2220 as the Health meter with its numeral', () => {
    const html = renderWithStore(<HealthBar className="placed" />, {
      hud: { player: FIGMA_HUD_PLAYER, announcements: [] },
    });
    expect(numeral(html)).toBe('1850');
    expect(html).toContain('aria-valuetext="1850 of 2220"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Health']);
    expect(html).toContain(`class="${String(styles.resource)} placed"`);
  });

  it('shows a dash and the no-data image before the first HUD publish, with no shield overlay', () => {
    const html = renderWithStore(<HealthBar />);
    expect(numeral(html)).toBe('—');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Health: No data yet']);
    expect(html).not.toMatch(/shield/i);
  });
});
