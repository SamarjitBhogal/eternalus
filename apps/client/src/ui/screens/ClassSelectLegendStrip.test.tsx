import { describe, expect, it } from 'vitest';

import type { LegendStripItem } from '../../bridge/selectors/selectClassPanel';
import { assetsWithBoxes, renderWithStore } from '../testStore';
import { ClassSelectLegendStrip } from './ClassSelectLegendStrip';

const FIGMA_ITEMS: readonly LegendStripItem[] = [
  { key: 'catalyst', name: 'Veridan', miniAssetId: 'catalyst-mini' },
  { key: 'oracle', name: 'Elarion', miniAssetId: 'oracle-mini' },
  { key: 'necromancer', name: 'Avedrin', miniAssetId: 'necromancer-mini' },
];

const render = (items: readonly LegendStripItem[]): string =>
  renderWithStore(<ClassSelectLegendStrip items={items} />);

/** The `<li>` start tags in order. */
const miniTags = (html: string): string[] => html.match(/<li\s[^>]*>/g) ?? [];

describe('ClassSelectLegendStrip', () => {
  it('shows the "Legends" header and the three Legends by name (72:786)', () => {
    const html = render(FIGMA_ITEMS);

    expect(html).toMatch(/<h4[^>]*>Legends<\/h4>/);
    expect([...html.matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map(([, name]) => name)).toEqual([
      'Veridan',
      'Elarion',
      'Avedrin',
    ]);
  });

  it("draws each portrait's legend-mini rendition at its placement box (I-45)", () => {
    const html = render(FIGMA_ITEMS);
    const tags = miniTags(html);

    expect(html).toContain('src="/assets/test/catalyst-mini@legend-mini.webp"');
    expect(tags[0]).toContain('data-slot="0"');
    expect(tags[0]).toContain('data-art-mode="image"');
    expect(tags[0]).toContain('--art-left:2px;--art-top:2px;--art-width:102px;--art-height:137px');
    expect(tags[1]).toContain('--art-left:3px;--art-top:3px;--art-width:100px;--art-height:135px');
  });

  it('leaves the empty arch for a Legend with no portrait, or one baked for another slot (CD-13)', () => {
    const html = render([
      { key: 'oracle', name: 'Elarion', miniAssetId: 'oracle-mini' },
      { key: 'paladin', name: 'Paladin', miniAssetId: null },
    ]);
    const tags = miniTags(html);

    expect(tags.map((tag) => /data-art-mode="(\w+)"/.exec(tag)?.[1])).toEqual(['cover', 'cover']);
    expect(html).toContain('data-arch-art="missing"');
    expect(html).not.toContain('oracle-mini');
  });

  it('leaves the empty arch for a portrait the store gives no box, or one baked 2 px lower', () => {
    const assets = assetsWithBoxes({
      'catalyst-mini@legend-mini': undefined,
      'necromancer-mini@legend-mini': { left: 341, top: 806, width: 102, height: 137 },
    });
    const tags = miniTags(
      renderWithStore(<ClassSelectLegendStrip items={FIGMA_ITEMS} />, { assets }),
    );

    expect(tags.map((tag) => /data-art-mode="(\w+)"/.exec(tag)?.[1])).toEqual([
      'cover',
      'image',
      'cover',
    ]);
  });

  it('shows at most the three Figma slots', () => {
    const four = [...FIGMA_ITEMS, { key: 'extra', name: 'Extra', miniAssetId: null }];

    expect(miniTags(render(four))).toHaveLength(3);
  });

  it('shows the pending line for a class with no Legend yet', () => {
    const html = render([]);

    expect(html).toContain('>Legends to come</p>');
    expect(miniTags(html)).toEqual([]);
  });

  it('is informational: nothing focusable or clickable', () => {
    expect(render(FIGMA_ITEMS)).not.toMatch(/<button|tabindex=|role="/);
  });
});
