import { describe, expect, it } from 'vitest';

import { ARCH_UNIT_PATH } from '../components/archUnitPath';
import { renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassSelectCardHalo } from './ClassSelectCardHalo';
import styles from './ClassSelectCardHalo.module.css';
import haloCss from './ClassSelectCardHalo.module.css?raw';

const render = (pickedClassId: string | null): string =>
  renderWithStore(
    <ClassSelectCardHalo cards={TEST_CONTENT.legendClasses} pickedClassId={pickedClassId} />,
  );

const count = (html: string, needle: string): number => html.split(needle).length - 1;

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('ClassSelectCardHalo', () => {
  it('draws one frost pane, then one blurred copy, per card, all hidden (62:200, CD-15)', () => {
    const html = render('magus');

    expect(count(html, `class="${String(styles.pane)}"`)).toBe(4);
    expect(count(html, `class="${String(styles.copy)}"`)).toBe(4);
    expect(html.indexOf(String(styles.frostLayer))).toBeLessThan(
      html.indexOf(String(styles.refractionLayer)),
    );
    expect(count(html, 'aria-hidden="true"')).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/role="|tabindex="/);
  });

  it("copies each card's art, frame and name in its accent, the picked one at its copy box", () => {
    const html = render('magus');

    expect(html).toContain('src="/assets/test/warrior-card-art.webp"');
    expect(html).toContain('>Legionnaire</span>');
    expect(html).toContain('--card-accent:var(--class-flying-accent)');
    expect(html).toMatch(/data-look="picked" style="left:1097px;top:220px/);
    expect(count(html, 'data-look="picked"')).toBe(2);
  });

  it('draws every copy idle before a pick', () => {
    expect(render(null)).not.toContain('data-look="picked"');
  });

  it('blurs the copies at σ 10 and keeps the panes outside the blurred layer', () => {
    const css = withoutComments(haloCss);

    expect(css).toMatch(/\.refractionLayer \{\s*filter: blur\(10px\);/);
    expect(css).toMatch(/backdrop-filter: blur\(26px\)/);
    expect(css).toMatch(/\.frostLayer,\s*\.refractionLayer \{[^}]*pointer-events: none;/);
    expect(css).not.toMatch(/z-index/);
  });

  // The visual audit of 62:125: clipped crisp to each copy's arch, outside the blurred
  // layer, the frost drew a hard arch-shaped edge round every card where Figma's halo fades.
  it("fades each frost pane's arch edge with the halo's σ 10 instead of clipping it", () => {
    const html = render('magus');
    const css = withoutComments(haloCss);
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector} \\{([^}]*)\\}`).exec(css)?.[1] ?? 'missing';
    const glass = (look: string): string =>
      rule(`\\.pane\\[data-look='${look}'\\] \\[data-arch-layer='glass'\\]`);
    const size = (look: string): string =>
      `${/width: ([\d.]+)px;/.exec(glass(look))?.[1] ?? 'missing'}, ${
        /height: ([\d.]+)px;/.exec(glass(look))?.[1] ?? 'missing'
      }`;
    const sigma = /\.refractionLayer \{\s*filter: blur\((\d+)px\);/.exec(css)?.[1];

    expect(html).toContain(
      `<filter id="sel-halo-frost-fade"><feGaussianBlur stdDeviation="${String(sigma)}"></feGaussianBlur></filter>`,
    );
    for (const [look, arch] of [
      ['idle', styles.maskArchIdle],
      ['picked', styles.maskArchPicked],
    ] as const) {
      expect(html).toContain(
        `<mask id="sel-halo-frost-${look}" class="${String(styles.frostMask)}"><g filter="url(#sel-halo-frost-fade)"><path class="${String(arch)}" d="${ARCH_UNIT_PATH}">`,
      );
      expect(glass(look)).toContain(`mask: url(#sel-halo-frost-${look});`);
      expect(rule(`\\.maskArch${look === 'idle' ? 'Idle' : 'Picked'}`)).toContain(
        `transform: scale(${size(look)});`,
      );
    }
    expect(rule("\\.pane \\[data-arch-layer='glass'\\]")).toContain('clip-path: none;');
    expect(rule('\\.frostMask')).toContain('mask-type: alpha;');
    expect(html.indexOf('<mask ')).toBeLessThan(html.indexOf(`class="${String(styles.pane)}"`));
  });
});
