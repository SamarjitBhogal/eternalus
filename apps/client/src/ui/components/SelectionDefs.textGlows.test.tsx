import { describe, expect, it } from 'vitest';

import globalCss from '../../styles/global.css?raw';
import { renderWithStore } from '../testStore';
import { SelectionDefs } from './SelectionDefs';
import { SELECTION_DEF_IDS, TEXT_GLOW_FILTERS } from './SelectionDefs.constants';
import styles from './SelectionDefs.module.css';
import defsCss from './SelectionDefs.module.css?raw';
import type { GlowFlood, TextGlowDef } from './SelectionDefs.types';

const html = renderWithStore(<SelectionDefs />);
const filters = [...html.matchAll(/<filter [^>]*>[\s\S]*?<\/filter>/g)].map(([markup]) => markup);

describe('SelectionDefs text glows', () => {
  const filterOf = (id: string): string =>
    filters.find((markup) => markup.includes(`id="${id}"`)) ?? 'missing';
  const attributes = (markup: string, element: string, name: string): readonly string[] =>
    [...markup.matchAll(new RegExp(`<${element} [^>]*${name}="([^"]*)"`, 'g'))].map(
      ([, value = '']) => value,
    );
  const ruleOf = (selector: string): string =>
    new RegExp(`\\n\\${selector} \\{([^}]*)\\}`).exec(defsCss)?.[1] ?? 'missing';
  const token = (name: string): string =>
    new RegExp(`\\n {2}${name}: ([^;]+);`).exec(globalCss)?.[1] ?? 'missing';
  const defOf = (id: string): TextGlowDef | undefined =>
    TEXT_GLOW_FILTERS.find((def) => def.id === id);
  const FLOOD_CLASS: Readonly<Partial<Record<GlowFlood, string>>> = {
    sky: String(styles.floodSky),
    countdown: String(styles.floodCountdown),
  };

  // OD-27: the measured σ (0.85 × radius / 2), not the derived radius / 2 (12.5 and 25).
  it('pins the 62:228 / 58:276 label glow: sky 0 4 σ 10.625, then sky 0 ∓4 σ 21.25 five times', () => {
    expect(defOf(SELECTION_DEF_IDS.glowLabel)?.shadows).toEqual([
      { dx: 0, dy: 4, sigma: 10.625, opacity: 1 },
      { dx: 0, dy: -4, sigma: 21.25, opacity: 1 },
      { dx: 0, dy: 4, sigma: 21.25, opacity: 1 },
      { dx: 0, dy: -4, sigma: 21.25, opacity: 1 },
      { dx: 0, dy: 4, sigma: 21.25, opacity: 1 },
      { dx: 0, dy: -4, sigma: 21.25, opacity: 1 },
    ]);
    expect(defOf(SELECTION_DEF_IDS.glowLabel)?.flood).toBe('sky');
  });

  // OD-27: the measured σ 3.4 (best of 2.8 to 4 on all three frames), not the derived radius / 2 (4).
  it('pins the 62:135 / 58:281 countdown glow: red 15 % at (±6, 0) and (0, ±6), σ 3.4', () => {
    expect(defOf(SELECTION_DEF_IDS.glowCountdown)?.shadows).toEqual([
      { dx: 6, dy: 0, sigma: 3.4, opacity: 0.15 },
      { dx: -6, dy: 0, sigma: 3.4, opacity: 0.15 },
      { dx: 0, dy: 6, sigma: 3.4, opacity: 0.15 },
      { dx: 0, dy: -6, sigma: 3.4, opacity: 0.15 },
    ]);
    expect(defOf(SELECTION_DEF_IDS.glowCountdown)?.flood).toBe('countdown');
    expect(TEXT_GLOW_FILTERS.map(({ id }) => id)).toEqual([
      SELECTION_DEF_IDS.glowLabel,
      SELECTION_DEF_IDS.glowCountdown,
    ]);
  });

  // The experiment's regions, kept: in Chrome the blur depends on the filter region (a 4.4-box
  // LOCK IN region moved its haze by up to 13 code values from the measured exp/union).
  it('keeps the measured exp/union and exp/union-cd regions', () => {
    expect(defOf(SELECTION_DEF_IDS.glowLabel)?.region).toEqual({
      x: -1,
      y: -3,
      width: 3,
      height: 7,
    });
    expect(defOf(SELECTION_DEF_IDS.glowCountdown)?.region).toEqual({
      x: -0.5,
      y: -0.5,
      width: 2,
      height: 2,
    });
  });

  // The visual audit of 62:125 and a Chrome probe: as CSS
  // text-shadows, or with a flood per branch, the haze drifted; alpha branches flooded once match.
  it.each(TEXT_GLOW_FILTERS)(
    'draws $id as alpha-only branches, merged, then flooded once beneath the source',
    ({ id, region, shadows, flood }) => {
      const markup = filterOf(id);
      const merged = [...markup.matchAll(/<feMergeNode in="(\w+)">/g)].map(([, from]) => from);
      const scaled = shadows.filter(({ opacity }) => opacity !== 1);

      expect(markup).toContain(
        `id="${id}" filterUnits="objectBoundingBox" x="${String(region.x)}" y="${String(region.y)}" width="${String(region.width)}" height="${String(region.height)}"`,
      );
      expect(attributes(markup, 'feOffset', 'in')).toEqual(shadows.map(() => 'SourceAlpha'));
      expect(attributes(markup, 'feOffset', 'dx')).toEqual(shadows.map(({ dx }) => String(dx)));
      expect(attributes(markup, 'feOffset', 'dy')).toEqual(shadows.map(({ dy }) => String(dy)));
      expect(attributes(markup, 'feGaussianBlur', 'stdDeviation')).toEqual(
        shadows.map(({ sigma }) => String(sigma)),
      );
      expect(attributes(markup, 'feFuncA', 'slope')).toEqual(
        scaled.map(({ opacity }) => String(opacity)),
      );
      expect(markup.match(/<feFuncA type="linear" /g) ?? []).toHaveLength(scaled.length);
      // One flood only, after the branches: none is composited into a branch.
      expect(attributes(markup, 'feFlood', 'class')).toEqual([FLOOD_CLASS[flood]]);
      expect(markup.match(/<feComposite /g)).toHaveLength(1);
      expect(merged).toEqual([
        ...shadows.map((_, index) => `shadow${String(index)}`),
        'glow',
        'SourceGraphic',
      ]);
      expect(markup).toContain('<feMerge result="shadows">');
      expect(markup).toContain(
        '<feComposite in="glowFlood" in2="shadows" operator="in" result="glow">',
      );
      expect(markup).toMatch(
        /<feMerge><feMergeNode in="glow"><\/feMergeNode><feMergeNode in="SourceGraphic"><\/feMergeNode><\/feMerge><\/filter>$/,
      );
    },
  );

  it('floods with tokens: the sky, and the countdown red whose 15 % token the opacity mirrors', () => {
    const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
    const red = hex
      .exec(token('--selection-countdown'))
      ?.slice(1)
      .map((channel) => parseInt(channel, 16));
    const opacities = defOf(SELECTION_DEF_IDS.glowCountdown)?.shadows.map(({ opacity }) => opacity);

    expect(ruleOf('.floodSky')).toBe('\n  flood-color: var(--selection-glow-sky);\n');
    expect(ruleOf('.floodCountdown')).toBe('\n  flood-color: var(--selection-countdown);\n');
    // Each flood is opaque; the countdown's shadow alpha is the --selection-countdown-glow token's.
    expect(token('--selection-glow-sky')).toMatch(hex);
    expect(red).toHaveLength(3);
    expect(opacities).toEqual([0.15, 0.15, 0.15, 0.15]);
    expect(token('--selection-countdown-glow')).toBe(
      `rgb(${red?.join(' ') ?? 'missing'} / ${String((opacities?.[0] ?? Number.NaN) * 100)}%)`,
    );
  });

  // Per side, the region fraction × the user's box ≥ bleed + 3σ + |offset| px.
  it.each(
    TEXT_GLOW_FILTERS.flatMap(({ id, region, shadows, users }) =>
      users.map((user) => ({ id, region, shadows, user })),
    ),
  )('sizes the $id region for $user.node', ({ region, shadows, user }) => {
    const reachX = Math.max(...shadows.map(({ dx, sigma }) => 3 * sigma + Math.abs(dx)));
    const reachY = Math.max(...shadows.map(({ dy, sigma }) => 3 * sigma + Math.abs(dy)));

    expect(Math.min(-region.x, region.x + region.width - 1) * user.width).toBeGreaterThanOrEqual(
      user.bleed + reachX,
    );
    expect(Math.min(-region.y, region.y + region.height - 1) * user.height).toBeGreaterThanOrEqual(
      user.bleed + reachY,
    );
  });
});
