import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { ArchCard, type ArchLayerKind } from './ArchCard';
import styles from './ArchCard.module.css';
import cardCss from './ArchCard.module.css?raw';
import { ARCH_UNIT_PATH } from './archUnitPath';

const ALL_LAYERS: readonly ArchLayerKind[] = [
  'glass',
  'shadow-plate',
  'outer-outline',
  'inner-outline',
  'text-scrim',
  'art',
  'focus-ring',
];

/** React's server renderer hoists a `<link rel="preload">` per image ahead of the markup. */
const withoutPreloads = (html: string): string =>
  html.replace(/^(?:<link rel="preload"[^>]*\/>)+/, '');

/** The data attributes in document order, e.g. every `data-arch-layer` value. */
const valuesOf = (html: string, attribute: string): string[] =>
  [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map(([, value = '']) => value);

/** The markup of one layer element (up to the next layer, or the end of the card). */
function layerMarkup(html: string, layer: ArchLayerKind): string {
  const start = html.indexOf(`data-arch-layer="${layer}"`);
  const next = html.indexOf('data-arch-layer="', start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

describe('ArchCard', () => {
  it('stacks the named layers in the given order, all hidden from assistive technology', () => {
    const html = renderWithStore(<ArchCard layers={ALL_LAYERS} artAssetId="warrior-card-art" />);
    const reversed = renderWithStore(
      <ArchCard layers={['art', 'outer-outline']} artAssetId="warrior-card-art" />,
    );

    expect(withoutPreloads(html)).toMatch(
      new RegExp(`^<div class="${String(styles.card)}" aria-hidden="true">`),
    );
    expect(valuesOf(html, 'data-arch-layer')).toEqual(ALL_LAYERS);
    expect(valuesOf(reversed, 'data-arch-layer')).toEqual(['art', 'outer-outline']);
  });

  it('draws every arch with the one unit path', () => {
    const html = renderWithStore(<ArchCard layers={ALL_LAYERS} artAssetId="warrior-card-art" />);

    expect(valuesOf(html, ' d')).toEqual(Array(7).fill(ARCH_UNIT_PATH));
    expect(html.match(/viewBox="0 0 1 1" preserveAspectRatio="none"/g)).toHaveLength(7);
  });

  it('covers the arch with the master in cover mode: under, clipped image, over, stroke', () => {
    const html = renderWithStore(<ArchCard layers={['art']} artAssetId="warrior-card-art" />);
    const art = layerMarkup(html, 'art');

    expect(art).toContain('data-arch-art="cover"');
    expect(valuesOf(art, 'data-arch-part')).toEqual(['under', 'image', 'over', 'stroke']);
    expect(art).toContain(
      `<div class="${String(styles.clip)}"><img data-arch-part="image" class="${String(styles.cover)}" src="/assets/test/warrior-card-art.webp" alt=""`,
    );
  });

  it('draws one unscaled rendition and no parts in image mode', () => {
    const html = renderWithStore(
      <ArchCard
        layers={['art']}
        artAssetId="oracle-card-art"
        artMode="image"
        artRendition="card-picked"
      />,
    );
    const art = layerMarkup(html, 'art');

    expect(valuesOf(art, 'data-arch-part')).toEqual(['image']);
    expect(art.match(/<img /g)).toHaveLength(1);
    expect(art).toContain('src="/assets/test/oracle-card-art@card-picked.webp"');
    expect(art).not.toContain('<svg');
  });

  it('draws the plate with both live 1 px strokes and the outer outline in plate mode (OD-1)', () => {
    const html = renderWithStore(
      <ArchCard
        layers={['art', 'inner-outline', 'outer-outline', 'focus-ring']}
        artAssetId="magus-card-plate-picked"
        artMode="plate"
      />,
    );

    expect(valuesOf(html, 'data-arch-layer')).toEqual([
      'art',
      'inner-outline',
      'outer-outline',
      'focus-ring',
    ]);
    expect(valuesOf(layerMarkup(html, 'art'), 'data-arch-part')).toEqual(['plate']);
    expect(html).toContain('src="/assets/test/magus-card-plate-picked.webp"');
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(valuesOf(layerMarkup(html, 'inner-outline'), 'data-arch-part')).toEqual([
      'art-stroke',
      'overlay-stroke',
    ]);
    expect(layerMarkup(html, 'inner-outline')).not.toContain('viewBox');
    expect(html).not.toMatch(/data-arch-part="(?:under|over|image)"/);
    expect(valuesOf(html, 'data-arch-part').filter((part) => part === 'stroke')).toHaveLength(2);
  });

  it('draws the inner outline as one stretched stroke outside plate mode', () => {
    for (const artMode of ['cover', 'image'] as const) {
      const inner = layerMarkup(
        renderWithStore(
          <ArchCard layers={['inner-outline']} artAssetId={null} artMode={artMode} />,
        ),
        'inner-outline',
      );

      expect(inner).toContain('viewBox="0 0 1 1" preserveAspectRatio="none"');
      expect(valuesOf(inner, 'data-arch-part')).toEqual(['stroke']);
    }
  });

  it('marks the art missing until its URL is in the store, in every mode', () => {
    const empty = { assets: assetsSlice.getInitialState() };
    for (const artMode of ['cover', 'image', 'plate'] as const) {
      const html = renderWithStore(
        <ArchCard
          layers={['art', 'outer-outline']}
          artAssetId="warrior-card-art"
          artMode={artMode}
        />,
        empty,
      );
      expect(html).toContain('data-arch-art="missing"');
      expect(html).not.toContain('<img');
    }
    expect(renderWithStore(<ArchCard layers={['art']} artAssetId={null} />)).toContain(
      'data-arch-art="missing"',
    );
  });

  it('sits at the integer floor of its origin and hands the remainder to the vector layers (I-45)', () => {
    const html = renderWithStore(
      <ArchCard
        layers={['art', 'outer-outline']}
        artAssetId="magus-card-plate-picked"
        artMode="plate"
        origin={{ x: 1106.015, y: 238 }}
      />,
    );

    expect(withoutPreloads(html)).toMatch(
      /^<div [^>]*style="left:1106px;top:238px;--arch-fx:0.015px;--arch-fy:0px"/,
    );
    expect(cardCss).toMatch(
      /\.vector,\s*\.coverArt,\s*\.glass,\s*\.box \{[^}]*translate: var\(--arch-fx, 0px\) var\(--arch-fy, 0px\);/,
    );
    expect(cardCss).toMatch(
      /\.plateStroke \{\s*translate: var\(--arch-fx, 0px\) var\(--arch-fy, 0px\);/,
    );
  });

  it('never moves, fits or rotates a rendition or plate, nor the root above it (I-45, I-88)', () => {
    const rule = (selector: string): string =>
      new RegExp(`\\n${selector} \\{([^}]*)\\}`).exec(cardCss)?.[1] ?? 'missing';

    for (const selector of ['\\.card', '\\.rasterArt', '\\.raster']) {
      expect(rule(selector)).not.toMatch(
        /translate|transform|rotate|scale|object-fit|object-position/,
      );
    }
  });

  it('shows the focus ring only under visible focus', () => {
    expect(cardCss).toMatch(/\.focusRing \{\s*opacity: 0;/);
    expect(cardCss).toMatch(/:focus-visible \.focusRing \{\s*opacity: 1;/);
    expect(cardCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/);
  });
});
