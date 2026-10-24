import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER, figmaHudState } from '../../bridge/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { FIGMA_MATCH_SETUP, withHudSetup } from './hudTestSupport';
import { WeaponPanel } from './WeaponPanel';
import styles from './WeaponPanel.module.css';

const withClass = (classId: string) => ({
  ...withHudSetup(figmaHudState()),
  matchSetup: { ...FIGMA_MATCH_SETUP, selection: { classId, specId: null } },
});

describe('WeaponPanel', () => {
  it('draws the kit weapon art at its placement box, above the weapon level bar', () => {
    const html = renderWithStore(<WeaponPanel />, withHudSetup(figmaHudState()));
    expect(html).toContain(
      `<img src="/assets/test/warrior-weapon-battle-axe.webp" alt="" aria-hidden="true" class="${String(styles.art)} ${String(styles.battleAxe)}"`,
    );
    expect(html.indexOf('aria-label="Weapon level"')).toBeLessThan(html.indexOf('<img'));
    expect(html).toContain('aria-valuenow="83"');
  });

  it('places the Magus staff by its own box (OD-8)', () => {
    const html = renderWithStore(<WeaponPanel />, withClass('magus'));
    expect(html).toContain(`class="${String(styles.art)} ${String(styles.staff)}"`);
  });

  it('draws no art for a kit without a weapon', () => {
    expect(renderWithStore(<WeaponPanel />, withClass('sentinel'))).not.toContain('<img');
  });

  it('hatches the weapon level bar while its value is unknown', () => {
    const html = renderWithStore(<WeaponPanel />, {
      ...withHudSetup(figmaHudState()),
      hud: { player: { ...FIGMA_HUD_PLAYER, weaponProgress: null }, announcements: [] },
    });
    expect(accessibleNames(html, '[role=img]')).toEqual(['Weapon level: No data yet']);
  });
});
