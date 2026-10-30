import { describe, expect, it } from 'vitest';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { accessibleNames, assetsWithBoxes, renderWithStore } from '../testStore';
import { LegendSelectCard } from './LegendSelectCard';
import styles from './LegendSelectCard.module.css';
import cardCss from './LegendSelectCard.module.css?raw';
import { legendSlot } from './legendSelectLayout';

const noop = (): void => undefined;

const ORACLE: LegendCardView = {
  specId: 'oracle',
  subClassName: 'Oracle',
  legendName: 'Elarion',
  roleLabel: 'Support',
  description: null,
  accentToken: '--legend-oracle-accent',
  isAvailable: true,
  isPicked: true,
  cardArtAssetId: 'oracle-card-art',
  refractionArtAssetId: 'oracle-refraction-art',
  rowPlateAssetId: 'oracle-row-plate',
  details: [],
  ratings: [],
};

function render(
  legend: LegendCardView,
  { index = 1, isRowPlateMode = false, isTabbable = false } = {},
): string {
  return renderWithStore(
    <LegendSelectCard
      legend={legend}
      slot={legendSlot(3, index)}
      isRowPlateMode={isRowPlateMode}
      isTabbable={isTabbable}
      onPick={noop}
      onPreview={noop}
      onKeyDown={noop}
    />,
  );
}

const layersOf = (html: string): string[] =>
  [...html.matchAll(/data-arch-layer="([^"]+)"/g)].map(([, layer = '']) => layer);

describe('LegendSelectCard', () => {
  it('is a checked radio in the picked look, titled in its accent, then the Legend name', () => {
    const html = render(ORACLE);

    expect(html).toMatch(/<button type="button" role="radio" class="[^"]+" aria-checked="true"/);
    expect(html).toContain('data-spec-id="oracle"');
    expect(html).toContain('data-look="picked"');
    expect(html).toContain('--card-accent:var(--legend-oracle-accent)');
    expect(html).toContain(`<span class="${String(styles.title)}">Oracle</span>`);
    expect(html).toContain(`<span class="${String(styles.name)}">Elarion</span>`);
    expect(accessibleNames(html, '[role=radio]')).toEqual(['Oracle Elarion']);
  });

  it('draws the picked look live: plate, frame, scrim, its rendition at its table box, stroke', () => {
    const html = render(ORACLE);

    expect(layersOf(html)).toEqual([
      'shadow-plate',
      'inner-outline',
      'text-scrim',
      'art',
      'outer-outline',
      'focus-ring',
    ]);
    expect(html).toContain('data-art-mode="image"');
    expect(html).toContain('src="/assets/test/oracle-card-art@card-picked.webp"');
    // 55:255 rendition (803, 210) 315 × 660 relative to the card root (792, 194).
    expect(html).toContain('--art-left:11px;--art-top:16px;--art-width:315px;--art-height:660px');
  });

  it('draws an idle card with its outlines and the idle rendition, holding no tab stop', () => {
    const html = render(
      { ...ORACLE, specId: 'catalyst', isPicked: false, cardArtAssetId: 'catalyst-card-art' },
      { index: 0 },
    );

    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('data-look="idle"');
    expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain('autofocus');
    expect(layersOf(html)).toEqual(['outer-outline', 'inner-outline', 'art', 'focus-ring']);
    expect(html).toContain('src="/assets/test/catalyst-card-art@card-idle.webp"');
    expect(html).toContain('left:501px;top:250px');
  });

  it('holds the tab stop and the entry focus when tabbable', () => {
    const html = render(ORACLE, { isTabbable: true });

    expect(html).toContain('tabindex="0"');
    expect(html).toContain('autofocus=""');
  });

  it('in row-plate mode draws only its text, focus ring and hit area (I-69)', () => {
    const html = render(ORACLE, { isRowPlateMode: true });

    expect(layersOf(html)).toEqual(['focus-ring']);
    expect(html).not.toContain('<img');
    expect(accessibleNames(html, '[role=radio]')).toEqual(['Oracle Elarion']);
  });

  it('shows only the sub-class title for a Legend with no name (OA3, CD-13)', () => {
    const html = render({ ...ORACLE, legendName: null });

    expect(html).not.toContain(String(styles.name));
    expect(accessibleNames(html, '[role=radio]')).toEqual(['Oracle']);
  });

  it('draws the placeholder arch when the Legend has no art (cover mode, CD-13)', () => {
    const html = render({ ...ORACLE, cardArtAssetId: null });

    expect(html).toContain('data-art-mode="cover"');
    expect(html).toContain('data-arch-art="missing"');
    expect(html).not.toContain('<img');
  });

  it('draws art live in cover mode where no rendition was baked for its slot', () => {
    // oracle-card-art@card-picked is baked at slot 1; at slot 0 it would float off its card.
    expect(render(ORACLE, { index: 0 })).toContain('data-art-mode="cover"');
    expect(render(ORACLE, { index: 0 })).toContain('src="/assets/test/oracle-card-art.webp"');
    expect(render({ ...ORACLE, cardArtAssetId: 'stray-art' })).toContain('data-art-mode="cover"');
  });

  it('places its rendition at the box the store gives it, and live where it gives none', () => {
    const card = (
      <LegendSelectCard
        legend={ORACLE}
        slot={legendSlot(3, 1)}
        isRowPlateMode={false}
        isTabbable={false}
        onPick={noop}
        onPreview={noop}
        onKeyDown={noop}
      />
    );
    const moved = renderWithStore(card, {
      assets: assetsWithBoxes({
        'oracle-card-art@card-picked': { left: 804, top: 211, width: 300, height: 600 },
      }),
    });
    const unboxed = renderWithStore(card, {
      assets: assetsWithBoxes({ 'oracle-card-art@card-picked': undefined }),
    });

    expect(moved).toContain('--art-left:12px;--art-top:17px;--art-width:300px;--art-height:600px');
    expect(unboxed).toContain('data-art-mode="cover"');
    expect(unboxed).not.toContain('--art-left');
  });

  it('marks a locked Legend aria-disabled with a lock and "Locked", never colour alone', () => {
    const html = render({ ...ORACLE, isPicked: false, isAvailable: false });

    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('viewBox="0 0 16 20"');
    expect(accessibleNames(html, '[role=radio]')).toEqual(['Oracle Elarion Locked']);
  });

  // 58:271 after the 2026-10-24 refresh: the owner set 55:257 to Cinzel 32, its auto-width box now
  // x 105.6, 124 wide (centre 167.6), top 544.4 in the card.
  it('centres the picked title on the live Figma 55:257 box, centre x 167.6 of the 336 px card (CSS)', () => {
    expect(cardCss).toMatch(
      /\.card\[data-look='picked'\] \.title \{\n {2}left: calc\(-0\.4px \+ var\(--card-fx\) \+ var\(--title-dx\)\);\n {2}top: calc\(544\.4px \+ var\(--card-fy\)\);\n {2}width: 336px;/,
    );
  });

  // The owner's 58:271 edit: 55:257, 55:259 and 55:261 all Cinzel 32 (were 40 picked, 36 idle).
  it.each(['picked', 'idle'])(
    'sets the %s card title at Cinzel 32 on its 43 px line (CSS)',
    (look) => {
      const rule =
        new RegExp(`\\.card\\[data-look='${look}'\\] \\.title \\{([^}]*)\\}`).exec(cardCss)?.[1] ??
        'missing';

      expect(rule).toContain('font-size: max(32px, calc(var(--text-min) / var(--stage-scale)));');
      expect(rule).toContain('line-height: calc(var(--leading-game-32) * 1px);');
    },
  );

  it('stacks idle cards above the picked one and keeps the text off translate (CSS)', () => {
    expect(cardCss).toMatch(/\.card\[data-look='picked'\] \{[^}]*z-index: 0;/);
    expect(cardCss).toMatch(/\.card\[data-look='idle'\] \{[^}]*z-index: 1;/);
    expect(cardCss).not.toMatch(/^\s*translate:/m);
  });
});
