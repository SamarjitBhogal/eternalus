import { describe, expect, it } from 'vitest';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { accessibleNames, renderWithStore } from '../testStore';
import haloStyles from './LegendSelectCardHalo.module.css';
import { LegendSelectCardRow } from './LegendSelectCardRow';
import styles from './LegendSelectCardRow.module.css';
import rowCss from './LegendSelectCardRow.module.css?raw';

const noop = (): void => undefined;

const legend = (specId: string, overrides: Partial<LegendCardView> = {}): LegendCardView => ({
  specId,
  subClassName: specId,
  legendName: null,
  roleLabel: null,
  description: null,
  accentToken: '--legend-oracle-accent',
  isAvailable: true,
  isPicked: false,
  cardArtAssetId: null,
  refractionArtAssetId: null,
  rowPlateAssetId: null,
  details: [],
  ratings: [],
  ...overrides,
});

const render = (
  legends: readonly LegendCardView[],
  { isRowPlateShown = false, tabbableIndex = 0 } = {},
): string =>
  renderWithStore(
    <LegendSelectCardRow
      labelledBy="heading"
      legends={legends}
      tabbableIndex={tabbableIndex}
      isRowPlateShown={isRowPlateShown}
      onPick={noop}
      onPreview={noop}
      onCardKeyDown={noop}
    />,
  );

const ROW = [legend('catalyst'), legend('oracle', { isPicked: true }), legend('necromancer')];

describe('LegendSelectCardRow', () => {
  it('is one radio group named by the step heading, the cards in content order', () => {
    const html = render(ROW, { tabbableIndex: 1 });

    expect(html).toContain('role="radiogroup" aria-labelledby="heading"');
    expect([...html.matchAll(/data-spec-id="([^"]+)"/g)].map(([, id]) => id)).toEqual([
      'catalyst',
      'oracle',
      'necromancer',
    ]);
    expect(html.split('tabindex="0"').length - 1).toBe(1);
    expect(html).toMatch(/data-spec-id="oracle"[^>]*tabindex="0"/);
    expect(accessibleNames(html, '[role=radio]')).toEqual(['catalyst', 'oracle', 'necromancer']);
  });

  it('says how many Legends it lays out', () => {
    expect(render(ROW)).toContain(`class="${String(styles.row)}" data-count="3"`);
    expect(render(ROW.slice(0, 2))).toContain('data-count="2"');
    expect(render(ROW.slice(0, 1))).toContain('data-count="1"');
  });

  it('draws the live halo beneath the cards while no row plate is shown', () => {
    const html = render(ROW);

    expect(html).toContain(String(haloStyles.refractionLayer));
    expect(html.indexOf(String(haloStyles.glassLayer))).toBeLessThan(html.indexOf('radiogroup'));
  });

  it('with the row plate drops the halo and puts only the picked card in row-plate mode', () => {
    const html = render(
      ROW.map((card) => ({ ...card, cardArtAssetId: `${card.specId}-card-art` })),
      { isRowPlateShown: true },
    );

    expect(html).not.toContain(String(haloStyles.glassLayer));
    expect(html).not.toContain(String(haloStyles.refractionLayer));
    const oracle = /data-spec-id="oracle".*?<\/button>/.exec(html)?.[0] ?? '';
    expect(oracle).not.toContain('data-arch-layer="art"');
    expect(oracle).toContain('data-arch-layer="focus-ring"');
    const catalyst = /data-spec-id="catalyst".*?<\/button>/.exec(html)?.[0] ?? '';
    expect(catalyst).toContain('data-arch-layer="art"');
  });

  it('creates no stacking context, so its layers stack with the step (§5.15)', () => {
    const rules = rowCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).not.toMatch(/z-index|opacity|filter|transform|translate|isolation/);
  });
});
