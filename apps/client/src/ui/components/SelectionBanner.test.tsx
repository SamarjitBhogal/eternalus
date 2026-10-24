import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { SelectionBanner } from './SelectionBanner';
import styles from './SelectionBanner.module.css';
import bannerCss from './SelectionBanner.module.css?raw';

describe('SelectionBanner', () => {
  it('draws the decorative banner art from the store under the <h1> title', () => {
    const html = renderWithStore(
      <SelectionBanner title="Legend Selection" bannerAssetId="test-banner" />,
    );

    // React's server renderer hoists a `<link rel="preload">` for each image ahead of the markup.
    expect(html).toContain(
      `<div class="${String(styles.banner)}">` +
        `<img src="/assets/test/test-banner.webp" alt="" aria-hidden="true" class="${String(styles.image)}" decoding="async" draggable="false"/>` +
        `<h1 class="${String(styles.title)}">Legend Selection</h1></div>`,
    );
  });

  it('shows only the title before the art loads, and without art', () => {
    const notLoaded = renderWithStore(
      <SelectionBanner title="Legend Selection" bannerAssetId="test-banner" />,
      { assets: assetsSlice.getInitialState() },
    );
    const noArt = renderWithStore(
      <SelectionBanner title="Legend Selection" bannerAssetId={null} />,
    );

    for (const html of [notLoaded, noArt]) {
      expect(html).not.toContain('<img');
      expect(html).toContain('>Legend Selection</h1>');
    }
  });

  it('draws the art at its 1731 × 92 placement box with no fit or transform (I-45)', () => {
    expect(bannerCss).toMatch(
      /\.banner \{[^}]*left: 102px;\s*top: 2px;\s*width: 1731px;\s*height: 92px;/,
    );
    expect(bannerCss).toMatch(/\.image \{[^}]*width: 1731px;\s*height: 92px;/);
    expect(bannerCss).not.toMatch(/object-fit|transform|translate|rotate/);
  });
});
