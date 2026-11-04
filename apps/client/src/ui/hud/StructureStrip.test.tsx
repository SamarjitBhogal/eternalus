import { describe, expect, it } from 'vitest';

import { figmaHudState } from '../../bridge/__fixtures__/hudFixtures';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { accessibleNames, renderWithStore } from '../testStore';
import { cssRule, FIGMA_MATCH_SETUP, withHudSetup } from './hudTestSupport';
import { StructureStrip } from './StructureStrip';
import styles from './StructureStrip.module.css';
import css from './StructureStrip.module.css?raw';

const tileIds = (html: string) =>
  [...html.matchAll(/data-structure-id="([^"]+)"/g)].map(([, id]) => id);
const teams = (html: string) => [...html.matchAll(/data-team="([^"]+)"/g)].map(([, t]) => t);

const darkPlayer = {
  ...withHudSetup(figmaHudState()),
  matchSetup: { ...FIGMA_MATCH_SETUP, playerTeam: 'dark' as const },
};

describe('StructureStrip', () => {
  it('lists the 8 allied tiles in identity order with the light ink and plain icons', () => {
    const html = renderWithStore(<StructureStrip side="allied" />, withHudSetup(figmaHudState()));
    expect(tileIds(html)).toEqual([
      'light-stronghold',
      'light-wall',
      'light-buff-tower-lane-0-0',
      'light-buff-tower-lane-1-0',
      'light-buff-tower-lane-2-0',
      'light-spawner-tower-lane-0-0',
      'light-spawner-tower-lane-1-0',
      'light-spawner-tower-lane-2-0',
    ]);
    expect(new Set(teams(html))).toEqual(new Set(['light']));
    expect(html).toContain(
      '--structure-icon:url(&quot;/assets/test/structure-stronghold.webp&quot;)',
    );
    expect(accessibleNames(html, '[role=group]')[0]).toBe('Your structures');
  });

  it('lays the allied strip out in the default layout: the strip class alone, which has a rule', () => {
    const html = renderWithStore(<StructureStrip side="allied" />, withHudSetup(figmaHudState()));
    expect(html).toMatch(
      new RegExp(
        `^<div role="group" aria-label="Your structures" class="${String(styles.strip)}">`,
      ),
    );
    expect(css).toMatch(/\.strip\s*\{/);
  });

  it('lays the enemy strip out mirrored, in the same identity order, with mirrored icons', () => {
    const html = renderWithStore(<StructureStrip side="enemy" />, withHudSetup(figmaHudState()));
    expect(html).toContain(`class="${String(styles.strip)} ${String(styles.enemy)}"`);
    expect(tileIds(html)[0]).toBe('dark-stronghold');
    expect(new Set(teams(html))).toEqual(new Set(['dark']));
    expect(html).toContain('/assets/test/structure-stronghold@mirrored.webp');
    expect(html).not.toMatch(/scaleX|transform/);
    expect(css).toMatch(/\.enemy\s*\{\s*flex-direction: row-reverse;/);
  });

  it('keeps absolute inks for a Dark player: allied red on the left, enemy blue on the right', () => {
    expect(new Set(teams(renderWithStore(<StructureStrip side="allied" />, darkPlayer)))).toEqual(
      new Set(['dark']),
    );
    expect(new Set(teams(renderWithStore(<StructureStrip side="enemy" />, darkPlayer)))).toEqual(
      new Set(['light']),
    );
  });

  it('names each tile with its health, or "No data yet" with a hatched bar', () => {
    const { match } = figmaHudState();
    const live = renderWithStore(<StructureStrip side="allied" />, {
      ...withHudSetup(figmaHudState()),
      match: { ...match, structures: match.structures.map((s) => ({ ...s, health: null })) },
    });
    expect(accessibleNames(live, '[role=group]').slice(0, 2)).toEqual([
      'Your structures',
      'Stronghold, No data yet',
    ]);
    const figma = renderWithStore(<StructureStrip side="allied" />, withHudSetup(figmaHudState()));
    expect(accessibleNames(figma, '[role=group]')[1]).toBe('Stronghold, 39%');
  });

  it('draws a destroyed tile with cracks over its icon and no health bar (DEC-69, DEC-108)', () => {
    const { match } = figmaHudState();
    const html = renderWithStore(<StructureStrip side="allied" />, {
      ...withHudSetup(figmaHudState()),
      match: {
        ...match,
        structures: match.structures.map((s) =>
          s.structureId === 'light-wall-segment-0' ? { ...s, health: { current: 0, max: 46 } } : s,
        ),
      },
    });
    /** A tile's markup: from its opening tag to the next tile's (or the end). */
    const tile = (id: string): string => {
      const start = html.lastIndexOf(
        '<div role="group"',
        html.indexOf(`data-structure-id="${id}"`),
      );
      const end = html.indexOf('<div role="group"', start + 1);
      return html.slice(start, end === -1 ? undefined : end);
    };

    expect(accessibleNames(html, '[role=group]').slice(1, 3)).toEqual([
      'Stronghold, 39%',
      'Wall, destroyed',
    ]);
    expect(tile('light-wall')).toContain('data-destroyed="true"');
    expect(tile('light-wall')).toContain(
      `<span class="${String(styles.cracks)}" aria-hidden="true">`,
    );
    expect(tile('light-wall')).not.toContain('role="meter"');
    expect(tile('light-stronghold')).not.toContain('data-destroyed');
    expect(tile('light-stronghold')).toContain('role="meter"');
    expect(html.match(/role="meter"/g)).toHaveLength(7);
  });

  it('darkens a destroyed icon and draws its cracks lighter, in CSS (DEC-69)', () => {
    expect(cssRule(css, ".tile[data-destroyed='true'] .icon")).toContain(
      'background-color: color-mix(in srgb, var(--structure-ink) 50%, var(--hud-frame-backdrop))',
    );
    expect(cssRule(css, '.cracks::before,\n.cracks::after')).toContain(
      'background: var(--hud-cream)',
    );
    expect(cssRule(css, '.cracks::before')).toContain('clip-path: polygon(');
    expect(cssRule(css, '.cracks::after')).toContain('clip-path: polygon(');
  });

  it('draws no icon before its file has loaded', () => {
    const html = renderWithStore(<StructureStrip side="allied" />, {
      ...withHudSetup(figmaHudState()),
      assets: assetsSlice.getInitialState(),
    });
    expect(html).not.toContain('--structure-icon');
  });
});
