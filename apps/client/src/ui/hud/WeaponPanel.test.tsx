import { describe, expect, it } from 'vitest';

import { loadedAssetsFor, TEST_HUD_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import type { RasterBox } from '../../bridge/catalogue.types';
import { FIGMA_HUD_PLAYER, figmaHudState } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore, TEST_CONTENT } from '../testStore';
import { cssRule, FIGMA_MATCH_SETUP, withHudSetup } from './hudTestSupport';
import { WeaponPanel } from './WeaponPanel';
import css from './WeaponPanel.module.css?raw';
import styles from './WeaponPanel.module.css';

const withClass = (classId: string) => ({
  ...withHudSetup(figmaHudState()),
  matchSetup: { ...FIGMA_MATCH_SETUP, selection: { classId, specId: null } },
});

/** The manifest's draw box of `assetId`, as the UI tests' HUD fixture restates it. */
const boxOf = (assetId: string): RasterBox => {
  const box = TEST_HUD_ASSET_BOXES[assetId];
  if (box === undefined) throw new Error(`no box for ${assetId}`);
  return box;
};

/** `.placed`'s `property` for an art boxed at `box`, in Figma px from the panel's origin. */
function placedPx(box: RasterBox, property: keyof RasterBox): number | undefined {
  const match = new RegExp(
    `${property}: calc\\(\\(?var\\(--weapon-art-${property}\\)(?: - (\\d+)\\))? \\* var\\(--hud-u\\)\\)`,
  ).exec(cssRule(css, '.placed'));
  return match === null ? undefined : box[property] - Number(match[1] ?? 0);
}

/** Where `.placed` draws an art boxed at `box`, from the panel's origin. */
const placedAt = (box: RasterBox) => ({
  left: placedPx(box, 'left'),
  top: placedPx(box, 'top'),
  width: placedPx(box, 'width'),
  height: placedPx(box, 'height'),
});

describe('WeaponPanel', () => {
  it('draws the kit weapon art at its manifest draw box, above the weapon level bar', () => {
    const html = renderWithStore(<WeaponPanel />, withHudSetup(figmaHudState()));
    expect(html).toContain(
      `<div class="${String(styles.panel)}" style="--weapon-art-left:387;--weapon-art-top:946;--weapon-art-width:274;--weapon-art-height:82">`,
    );
    expect(html).toContain(
      `<img src="/assets/test/warrior-weapon-battle-axe.webp" alt="" aria-hidden="true" class="${String(styles.art)} ${String(styles.placed)}"`,
    );
    expect(html.indexOf('aria-label="Weapon level"')).toBeLessThan(html.indexOf('<img'));
    expect(html).toContain('aria-valuenow="83"');
  });

  it('places the Magus staff by its own manifest box (OD-8)', () => {
    const html = renderWithStore(<WeaponPanel />, withClass('magus'));
    expect(html).toContain(
      'style="--weapon-art-left:457;--weapon-art-top:977;--weapon-art-width:133;--weapon-art-height:19"',
    );
    expect(html).toContain(`class="${String(styles.art)} ${String(styles.placed)}"`);
  });

  it('draws a box at its frame px less the panel origin (397, 956), at the file size', () => {
    expect(placedAt(boxOf('warrior-weapon-battle-axe'))).toEqual({
      left: -10,
      top: -10,
      width: 274,
      height: 82,
    });
    expect(placedAt(boxOf('magus-weapon-staff'))).toEqual({
      left: 60,
      top: 21,
      width: 133,
      height: 19,
    });
  });

  it('fits an art the manifest gives no box, whole and centred, into the art layout box', () => {
    const assets = loadedAssetsFor(TEST_CONTENT);
    const html = renderWithStore(<WeaponPanel />, {
      ...withHudSetup(figmaHudState()),
      assets: { ...assets, boxesByGroup: { ...assets.boxesByGroup, match: {} } },
    });
    expect(html).toContain(`<div class="${String(styles.panel)}">`);
    expect(html).toContain(
      `<img src="/assets/test/warrior-weapon-battle-axe.webp" alt="" aria-hidden="true" class="${String(styles.art)} ${String(styles.fitted)}"`,
    );
    expect(html).not.toContain('--weapon-art');
    // Battle Axe 62:241's own box (397, 956) 254 × 62: the panel's origin, above the level bar.
    expect(cssRule(css, '.fitted').replace(/\s+/g, ' ').trim()).toBe(
      'left: 0; top: 0; width: calc(254 * var(--hud-u)); height: calc(62 * var(--hud-u)); object-fit: contain;',
    );
  });

  it('draws no art for a kit without a weapon', () => {
    const html = renderWithStore(<WeaponPanel />, withClass('sentinel'));
    expect(html).not.toContain('<img');
    expect(html).not.toContain('--weapon-art');
  });

  it('hatches the weapon level bar while its value is unknown', () => {
    const html = renderWithStore(<WeaponPanel />, {
      ...withHudSetup(figmaHudState()),
      hud: { player: { ...FIGMA_HUD_PLAYER, weaponProgress: null }, announcements: [] },
    });
    expect(accessibleNames(html, '[role=img]')).toEqual(['Weapon level: No data yet']);
  });
});
