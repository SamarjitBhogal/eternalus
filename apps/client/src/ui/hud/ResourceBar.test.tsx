import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../../bridge/__fixtures__/hudFixtures';
import { accessibleNames, renderWithStore } from '../testStore';
import { ResourceBar } from './ResourceBar';
import styles from './ResourceBar.module.css';
import css from './ResourceBar.module.css?raw';

const withFigmaPlayer = { hud: { player: FIGMA_HUD_PLAYER, announcements: [] } };

const numeral = (html: string) =>
  new RegExp(`<span class="${String(styles.value)}" aria-hidden="true">([^<]*)</span>`).exec(
    html,
  )?.[1];

describe('ResourceBar', () => {
  it('shows the Figma health 1850 of 2220 as a meter at 83 % with its numeral', () => {
    const html = renderWithStore(<ResourceBar resource="health" />, withFigmaPlayer);
    expect(numeral(html)).toBe('1850');
    expect(html).toContain('aria-valuenow="83"');
    expect(html).toContain('aria-valuetext="1850 of 2220"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Health']);
  });

  it('shows the Figma aether 4700', () => {
    const html = renderWithStore(<ResourceBar resource="aether" />, withFigmaPlayer);
    expect(numeral(html)).toBe('4700');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Aether']);
  });

  it('shows a dash and the no-data image before the first HUD publish', () => {
    const html = renderWithStore(<ResourceBar resource="health" />);
    expect(numeral(html)).toBe('—');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Health: No data yet']);
  });

  it('nudges the numeral box 1 unit below the Figma top 2 (the audited baseline knob)', () => {
    const value = /\.value \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(value).toContain('--value-baseline-nudge: 1;');
    expect(value).toContain('top: calc((2 + var(--value-baseline-nudge)) * var(--hud-u));');
    expect(value).not.toMatch(/translate/);
  });

  it('rounds a fractional value and draws no shield overlay', () => {
    const html = renderWithStore(<ResourceBar resource="aether" />, {
      hud: { player: { ...FIGMA_HUD_PLAYER, aether: 4699.6 }, announcements: [] },
    });
    expect(numeral(html)).toBe('4700');
    expect(html).not.toMatch(/shield/i);
  });
});
