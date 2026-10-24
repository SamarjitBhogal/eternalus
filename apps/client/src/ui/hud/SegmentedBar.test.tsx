import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import globalCss from '../../styles/global.css?raw';
import { accessibleNames } from '../testStore';
import { cssRule } from './hudTestSupport';
import { SegmentedBar } from './SegmentedBar';
import styles from './SegmentedBar.module.css';
import css from './SegmentedBar.module.css?raw';

const render = (fraction: number | null, valueText?: string) =>
  renderToStaticMarkup(
    <SegmentedBar
      label="Health"
      fraction={fraction}
      valueText={valueText}
      tone="health"
      size="resource"
    />,
  );

const fillClasses = (html: string) =>
  [...html.matchAll(/<div class="([^"]*)"( style="[^"]*")?><\/div>/g)].map(
    ([, classes = '', style = '']) => `${classes}${style}`,
  );

/** Each tone rule and the token family its fades come from. */
const TONE_TOKENS = [
  ['.toneHealth', 'health'],
  ['.toneAether', 'aether'],
  ['.toneCream', 'bar-cream'],
] as const;
const FADES = [1, 2, 3] as const;

/** global.css without its comments. */
const tokenCss = globalCss.replace(/\/\*[\s\S]*?\*\//g, '');
/** The custom properties a block of global.css declares, each value's whitespace collapsed. */
const declarationsOf = (block: RegExp): ReadonlyMap<string, string> =>
  new Map(
    [...(block.exec(tokenCss)?.[1] ?? '').matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
      ([, name = '', value = '']) => [name, value.replace(/\s+/g, ' ').trim()],
    ),
  );
const FIGMA_SET = declarationsOf(/^:root \{([^}]*)\}/m);
const MINIMUMS_BLOCK = declarationsOf(/^:root\[data-contrast='minimums'\] \{([^}]*)\}/m);

describe('SegmentedBar', () => {
  it('fills two segments and leads the third at 50 % for the Figma value 5/6', () => {
    const html = render(5 / 6, '1850 of 2220');
    expect(fillClasses(html)).toEqual([
      `${String(styles.fill)} ${String(styles.full)}`,
      `${String(styles.fill)} ${String(styles.full)}`,
      `${String(styles.fill)} ${String(styles.leading)} style="--segmented-bar-fill:50%"`,
    ]);
  });

  it('is a meter with the percentage, min, max and the spoken value', () => {
    const html = render(5 / 6, '1850 of 2220');
    expect(html).toContain('role="meter"');
    expect(html).toContain('aria-valuenow="83"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuetext="1850 of 2220"');
    expect(accessibleNames(html, '[role=meter]')).toEqual(['Health']);
  });

  it('is an image "No data yet" with hatched, hidden segments when the value is unknown', () => {
    const html = render(null);
    expect(html).toContain('role="img"');
    expect(html).not.toContain('aria-valuenow');
    expect(accessibleNames(html, '[role=img]')).toEqual(['Health: No data yet']);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(3);
    expect(html.match(new RegExp(String(styles.noData), 'g'))).toHaveLength(3);
  });

  it('draws the marker 1 % of the fill but never under 1 px, and transitions nothing', () => {
    expect(css).toContain('var(--bar-marker) calc(var(--segmented-bar-fill) + max(1%, 1px))');
    expect(css).toContain('var(--bar-rest) calc(var(--segmented-bar-fill) + 2 * max(1%, 1px))');
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/transition|@property/);
  });

  it('splits the marker → rest step in four, in the legacy sRGB space', () => {
    const leading = cssRule(css, '.leading');
    expect(leading).toContain('90deg in srgb,');
    const stops = leading
      .split('\n')
      .map((line) => line.trim().replace(/,$/, ''))
      .filter((line) => line.startsWith('var(--bar-'));
    expect(stops).toEqual([
      'var(--bar-full) 0%',
      'var(--bar-peak) var(--segmented-bar-fill)',
      'var(--bar-marker) calc(var(--segmented-bar-fill) + max(1%, 1px))',
      'var(--bar-fade-1) calc(var(--segmented-bar-fill) + 1.25 * max(1%, 1px))',
      'var(--bar-fade-2) calc(var(--segmented-bar-fill) + 1.5 * max(1%, 1px))',
      'var(--bar-fade-3) calc(var(--segmented-bar-fill) + 1.75 * max(1%, 1px))',
      'var(--bar-rest) calc(var(--segmented-bar-fill) + 2 * max(1%, 1px))',
      'var(--bar-rest) 100%',
    ]);
  });

  it('takes every fade from its bar token and computes no colour (I-18, OD-25 a)', () => {
    for (const [selector, tone] of TONE_TOKENS) {
      const rule = cssRule(css, selector);
      for (const index of FADES) {
        expect(rule).toContain(
          `--bar-fade-${String(index)}: var(--hud-${tone}-fade-${String(index)})`,
        );
      }
    }
    expect(cssRule(css, '.toneHealth')).toContain('--bar-marker: var(--hud-marker)');
    expect(cssRule(css, '.toneAether')).toContain('--bar-marker: var(--hud-marker)');
    expect(cssRule(css, '.toneCream')).toContain('--bar-marker: var(--hud-bar-cream-marker)');
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(|\bfrom\b|255/i,
    );
  });

  it('declares each fade once, in :root, so every colour set derives its own (OD-25 a)', () => {
    for (const [, tone] of TONE_TOKENS) {
      for (const index of FADES) {
        const name = `--hud-${tone}-fade-${String(index)}`;
        expect([name, tokenCss.match(new RegExp(`${name}\\s*:`, 'g'))?.length]).toEqual([name, 1]);
        expect([name, FIGMA_SET.has(name)]).toEqual([name, true]);
      }
    }
    // var() resolves on <html>, where the minimums block re-declares what the fades read.
    for (const source of ['--hud-health-rest', '--hud-aether-rest', '--hud-bar-cream-marker']) {
      expect([source, MINIMUMS_BLOCK.has(source)]).toEqual([source, true]);
    }
  });

  it('fades health and aether in straight alpha from their rest token towards the white marker', () => {
    // t = .25 / .5 / .75 from the marker: each channel and the alpha move (1 - t) of the way back.
    for (const tone of ['health', 'aether'] as const) {
      for (const [index, share] of [
        [1, '0.75'],
        [2, '0.5'],
        [3, '0.25'],
      ] as const) {
        expect(FIGMA_SET.get(`--hud-${tone}-fade-${String(index)}`)).toBe(
          `rgb( from var(--hud-${tone}-rest) calc(r + (255 - r) * ${share}) ` +
            `calc(g + (255 - g) * ${share}) calc(b + (255 - b) * ${share}) / ` +
            `calc(alpha + (1 - alpha) * ${share}) )`,
        );
      }
    }
    // The formula's 255 and 1 are that marker: opaque white, declared once, so in every colour set.
    const markers = [...globalCss.matchAll(/--hud-marker:\s*([^;]+);/g)].map(([, value = '']) =>
      value.trim(),
    );
    expect(markers).toEqual(['#ffffff']);
  });

  it('keeps the cream ramp as drawn: its fades are the premultiplied points', () => {
    for (const [index, marker] of [
      [1, '75%'],
      [2, '50%'],
      [3, '25%'],
    ] as const) {
      expect(FIGMA_SET.get(`--hud-bar-cream-fade-${String(index)}`)).toBe(
        `color-mix( in srgb, var(--hud-bar-cream-marker) ${marker}, var(--hud-bar-cream-rest) )`,
      );
    }
  });

  it('takes its size and tone from the props and its place from the caller', () => {
    const html = renderToStaticMarkup(
      <SegmentedBar label="Ultimate" fraction={1} tone="cream" size="ultimate" className="place" />,
    );
    expect(html).toContain(
      `class="${String(styles.bar)} ${String(styles.toneCream)} ${String(styles.ultimate)} place"`,
    );
  });
});
