import { describe, expect, it } from 'vitest';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { assetsWithBoxes, renderWithStore } from '../testStore';
import { LegendSelectCardHalo } from './LegendSelectCardHalo';
import styles from './LegendSelectCardHalo.module.css';
import haloCss from './LegendSelectCardHalo.module.css?raw';

const legend = (specId: string, overrides: Partial<LegendCardView> = {}): LegendCardView => ({
  specId,
  subClassName: specId,
  legendName: null,
  roleLabel: null,
  description: null,
  accentToken: '--legend-oracle-accent',
  isAvailable: true,
  isPicked: false,
  cardArtAssetId: `${specId}-card-art`,
  refractionArtAssetId: `${specId}-card-art`,
  rowPlateAssetId: null,
  details: [],
  ratings: [],
  ...overrides,
});

const MAGUS_ROW = [
  legend('catalyst', { legendName: 'Veridan' }),
  legend('oracle', {
    legendName: 'Elarion',
    isPicked: true,
    refractionArtAssetId: 'oracle-refraction-art',
  }),
  legend('necromancer', { legendName: 'Avedrin' }),
];

const count = (html: string, text: string): number => html.split(text).length - 1;

/** React's server renderer hoists a `<link rel="preload">` per image ahead of the markup. */
const withoutPreloads = (html: string): string =>
  html.replace(/^(?:<link rel="preload"[^>]*\/>)+/, '');

describe('LegendSelectCardHalo', () => {
  it('draws one frost pane and one blurred copy per Legend, all decorative (61:3)', () => {
    const html = renderWithStore(<LegendSelectCardHalo legends={MAGUS_ROW} />);

    expect(count(html, `class="${String(styles.pane)}"`)).toBe(3);
    expect(count(html, `class="${String(styles.copy)}"`)).toBe(3);
    expect(withoutPreloads(html)).toMatch(
      new RegExp(`^<div class="${String(styles.glassLayer)}" aria-hidden="true">`),
    );
    expect(html).toContain(`<div class="${String(styles.refractionLayer)}" aria-hidden="true">`);
    // The panes come first, as siblings of the blurred layer (backdrop-root rule, S§5).
    expect(html.indexOf(String(styles.glassLayer))).toBeLessThan(
      html.indexOf(String(styles.refractionLayer)),
    );
  });

  it('draws each copy from its refraction rendition at the copy look of its card', () => {
    const html = renderWithStore(<LegendSelectCardHalo legends={MAGUS_ROW} />);

    expect(html).toContain('src="/assets/test/oracle-refraction-art@refraction-picked.webp"');
    expect(html).toContain('src="/assets/test/catalyst-card-art@refraction-idle.webp"');
    expect(html).toContain('src="/assets/test/necromancer-card-art@refraction-idle.webp"');
    expect(count(html, 'data-look="picked"')).toBe(2);
    // 61:11 sits at (1123, 222); its rendition (1127, 227) relative to that root.
    expect(html).toContain('left:1123px;top:222px');
    expect(html).toContain('--art-left:4px;--art-top:5px;--art-width:306px;--art-height:619px');
  });

  it("places each copy's rendition at the box the store gives it, and live where it gives none", () => {
    const html = renderWithStore(<LegendSelectCardHalo legends={MAGUS_ROW} />, {
      assets: assetsWithBoxes({
        'necromancer-card-art@refraction-idle': { left: 1128, top: 228, width: 300, height: 600 },
        'catalyst-card-art@refraction-idle': undefined,
      }),
    });

    expect(html).toContain('--art-left:5px;--art-top:6px;--art-width:300px;--art-height:600px');
    expect(html.match(/data-art-mode="(\w+)"/g)).toEqual([
      'data-art-mode="cover"',
      'data-art-mode="image"',
      'data-art-mode="image"',
    ]);
  });

  it('repeats the card names in the copies, titled in the accent', () => {
    const html = renderWithStore(<LegendSelectCardHalo legends={MAGUS_ROW} />);

    expect(html).toContain(
      `<span class="${String(styles.title)}" style="color:var(--legend-oracle-accent)">oracle</span>`,
    );
    expect(html).toContain(`<span class="${String(styles.name)}">Avedrin</span>`);
  });

  it('stacks both layers at -1, beneath every element Figma draws above 61:3 (§5.15)', () => {
    expect(haloCss).toMatch(/\.glassLayer,\s*\.refractionLayer \{[^}]*z-index: -1;/);
    expect(haloCss).toMatch(/\.refractionLayer \{[^}]*opacity: 0\.6;[^}]*filter: blur\(10px\);/);
  });
});
