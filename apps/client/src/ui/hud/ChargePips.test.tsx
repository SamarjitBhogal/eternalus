import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../../bridge/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { ChargePips } from './ChargePips';
import styles from './ChargePips.module.css';

const render = (ultimatePips: typeof FIGMA_HUD_PLAYER.ultimatePips) =>
  renderWithStore(<ChargePips />, {
    hud: { player: { ...FIGMA_HUD_PLAYER, ultimatePips }, announcements: [] },
  });

const fillTops = (html: string) =>
  [
    ...html.matchAll(new RegExp(`<rect class="${String(styles.fill)}" x="[^"]+" y="([^"]+)"`, 'g')),
  ].map(([, y]) => Number(y));

const boxStrokes = (html: string) =>
  [
    ...html.matchAll(
      new RegExp(
        `<rect class="${String(styles.box)}" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"`,
        'g',
      ),
    ),
  ].map(([, x, y, width, height]) => ({
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height),
  }));

describe('ChargePips', () => {
  it('fills 2 of 3 boxes bottom-up as the Figma draws them, at its geometry', () => {
    const html = render({ filled: 2, total: 3 });
    expect(html).toContain('viewBox="0 0 24 83.5113"');
    expect(fillTops(html)).toEqual([29.825 + 2.3862, 59.65 + 2.3862]);
    expect(html.match(new RegExp(String(styles.box), 'g'))).toHaveLength(3);
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="3"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Ultimate charges']);
  });

  it('draws each box stroke on the 1/8 px edges the Figma render shows, fills unchanged', () => {
    const html = render({ filled: 2, total: 3 });
    // hud.figma.png: 946–969.875, 975.875–999.625, 1005.625–1029.5 (frame px; box tops at 946).
    expect(boxStrokes(html)).toEqual([
      { x: 0.5, y: 0.5, width: 22.8613, height: 22.875 },
      { x: 0.5, y: 30.375, width: 22.8613, height: 22.75 },
      { x: 0.5, y: 60.125, width: 22.8613, height: 22.875 },
    ]);
  });

  it('puts a fourth box on the same edge grid', () => {
    const html = render({ filled: 0, total: 4 });
    // Node edges 89.475 and 113.3363 snap to 89.5 and 113.375.
    expect(boxStrokes(html)[3]).toEqual({ x: 0.5, y: 90, width: 22.8613, height: 22.875 });
  });

  it('takes the box count from the data', () => {
    const html = render({ filled: 1, total: 4 });
    expect(html.match(new RegExp(String(styles.box), 'g'))).toHaveLength(4);
    expect(fillTops(html)).toEqual([3 * 29.825 + 2.3862]);
  });

  it('hatches the Figma three boxes and is an image "No data yet" while unknown', () => {
    const html = render(null);
    expect(html.match(/fill="url\(#[^)]+\)"/g)).toHaveLength(3);
    expect(fillTops(html)).toEqual([]);
    expect(html).not.toContain('aria-valuenow');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Ultimate charges: No data yet']);
  });
});
