import { describe, expect, it } from 'vitest';

import { TEST_ASSET_BOXES } from '../../bridge/__fixtures__/assetFixtures';
import { renderWithStore, TEST_CONTENT } from '../testStore';
import haloStyles from './ClassSelectCardHalo.module.css';
import { ClassSelectCardRow } from './ClassSelectCardRow';
import styles from './ClassSelectCardRow.module.css';
import rowCss from './ClassSelectCardRow.module.css?raw';
import cardCss from './ClassSelectCard.module.css?raw';
import stepCss from './ClassSelectStep.module.css?raw';
import altStepCss from './ClassSelectAltStep.module.css?raw';
import type { RowPlate } from './selectionGeometry.types';

/**
 * The module stylesheets of every component drawn inside the artboard on the class steps: the
 * class-step modules, and the shared ones the shell and the steps render.
 */
const MODULES = import.meta.glob<string>(
  [
    './ClassSelect*.module.css',
    './CharacterSelectScreen.module.css',
    '../components/{SelectionStage,SelectionBanner,Countdown,TeamBadge,InfoPanel,InfoPanelDetails,InfoPanelRules,GlowButton,KeyPrompt,KeyGlyph,AllyRoster,AllyTile,ArchCard,LockGlyph}.module.css',
  ],
  { query: '?raw', import: 'default', eager: true },
);

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of the rule whose selector is exactly `selector`. */
function declarationsOf(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(withoutComments(css))?.[1] ?? ''
  );
}

const PLATE_BOX = TEST_ASSET_BOXES['class-row-plate-magus'];
const PLATE: RowPlate | null =
  PLATE_BOX === undefined
    ? null
    : { url: '/assets/test/class-row-plate-magus.webp', box: PLATE_BOX };

function render(rowPlate: RowPlate | null, pickedClassId: string | null = 'magus'): string {
  const noop = (): void => undefined;
  return renderWithStore(
    <ClassSelectCardRow
      labelledBy="choose"
      describedBy="panel"
      cards={TEST_CONTENT.legendClasses}
      allyCounts={{ warrior: 2, sentinel: 3, magus: 2, flying: 2 }}
      pickedClassId={pickedClassId}
      previewClassId={null}
      tabbableIndex={2}
      autoFocusClassId={null}
      rowPlate={rowPlate}
      onPick={noop}
      onPreview={noop}
      onCardKeyDown={noop}
    />,
  );
}

describe('ClassSelectCardRow', () => {
  it('is one radio group in content order, labelled by the step heading, one tab stop', () => {
    const html = render(PLATE);

    expect(html).toMatch(/role="radiogroup" aria-labelledby="choose"/);
    expect([...html.matchAll(/data-class-id="([^"]+)"/g)].map(([, id]) => id)).toEqual([
      'warrior',
      'sentinel',
      'magus',
      'flying',
    ]);
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html).toMatch(/data-count="4"/);
  });

  it('draws the row plate at its full box beneath the cards, and no live halo (T-CLS-11, I-69)', () => {
    const html = render(PLATE);
    const plate = html.indexOf(`class="${String(styles.rowPlate)}"`);

    expect(plate).toBeGreaterThan(-1);
    expect(plate).toBeLessThan(html.indexOf('role="radiogroup"'));
    expect(html).toContain(
      `src="/assets/test/class-row-plate-magus.webp" style="left:491px;top:198px;width:1216px;height:683px"`,
    );
    expect(html).not.toContain(String(haloStyles.refractionLayer));
    expect(html).not.toContain(String(haloStyles.frostLayer));
  });

  it('draws the live halo beneath the cards without a row plate', () => {
    const html = render(null, 'warrior');

    expect(html).not.toContain(String(styles.rowPlate));
    expect(html.indexOf(String(haloStyles.refractionLayer))).toBeLessThan(
      html.indexOf('role="radiogroup"'),
    );
  });

  it("lifts the row above the step and the shell with its module's z-index 1 (§5.15)", () => {
    const row = declarationsOf(rowCss, '.row');

    expect(row).toMatch(/position:\s*absolute;/);
    expect(row).toMatch(/z-index:\s*1;/);
    expect(row).toMatch(/pointer-events:\s*none;/);
    expect(declarationsOf(rowCss, '.rowPlate')).toMatch(/pointer-events:\s*none;/);
    expect(declarationsOf(cardCss, '.card')).toMatch(/pointer-events:\s*auto;/);
    expect(render(PLATE)).not.toMatch(/z-index/);
  });

  it('declares no other z-index at or above 1 in any module drawn on the class steps', () => {
    const zIndexes = Object.entries(MODULES).flatMap(([path, css]) =>
      [...withoutComments(css).matchAll(/([^{}]+)\{[^{}]*?z-index:\s*([^;]+);/g)].map(
        ([, selector = '', value = '']) => ({
          where: `${path} ${selector.trim()}`,
          value: value.trim(),
        }),
      ),
    );

    expect(Object.keys(MODULES).length).toBeGreaterThanOrEqual(15);
    expect(zIndexes.filter(({ value }) => !/^(?:-?\d+|auto)$/.test(value))).toEqual([]);
    expect(zIndexes.filter(({ value }) => value !== 'auto' && Number(value) >= 1)).toEqual([
      { where: './ClassSelectCardRow.module.css .row', value: '1' },
    ]);
  });

  it('keeps both class steps free of stacking contexts, so the row can rise above the shell', () => {
    const forbidden =
      /(?:^|;)\s*(?:z-index|opacity|transform|translate|scale|rotate|filter|backdrop-filter|isolation|mix-blend-mode|mask|clip-path|contain|will-change)\s*:/;

    for (const css of [stepCss, altStepCss]) {
      const step = declarationsOf(css, '.step');
      expect(step).toMatch(/position:\s*absolute;/);
      expect(step).not.toMatch(forbidden);
    }
  });
});
