import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { AssetImage } from './AssetImage';

const PORTRAIT = '/assets/oracle-portrait.webp';
const PORTRAIT_TILE = '/assets/oracle-portrait@ally-tile.webp';

const loaded = assetsSlice.reducer(
  undefined,
  assetsSlice.actions.groupUrlsChanged({
    group: 'selection',
    urls: { 'oracle-portrait': PORTRAIT, 'oracle-portrait@ally-tile': PORTRAIT_TILE },
    boxes: {},
  }),
);
const empty = assetsSlice.getInitialState();

describe('AssetImage', () => {
  it('renders nothing until the URL is in the store', () => {
    expect(renderWithStore(<AssetImage assetId="oracle-portrait" />, { assets: empty })).toBe('');
    expect(renderWithStore(<AssetImage assetId={null} />, { assets: loaded })).toBe('');
  });

  it('draws the rendition file when the manifest has one, the asset file otherwise', () => {
    const tile = renderWithStore(<AssetImage assetId="oracle-portrait" rendition="ally-tile" />, {
      assets: loaded,
    });
    const card = renderWithStore(<AssetImage assetId="oracle-portrait" rendition="card-idle" />, {
      assets: loaded,
    });

    expect(tile).toContain(`src="${PORTRAIT_TILE}"`);
    expect(card).toContain(`src="${PORTRAIT}"`);
  });

  it('is decorative by default and named when given alt text', () => {
    const decorative = renderWithStore(<AssetImage assetId="oracle-portrait" className="tile" />, {
      assets: loaded,
    });
    const named = renderWithStore(<AssetImage assetId="oracle-portrait" alt="Oracle" />, {
      assets: loaded,
    });

    // React's server renderer adds a `<link rel="preload">` before an `<img>`; only the image matters.
    expect(decorative).toContain(
      `<img src="${PORTRAIT}" alt="" aria-hidden="true" class="tile" decoding="async" draggable="false"/>`,
    );
    expect(named).toContain('alt="Oracle"');
    expect(named).not.toContain('aria-hidden');
  });

  it('takes a CSS module class as read (possibly undefined) and writes none for undefined', () => {
    const classes: Readonly<Record<string, string>> = { tile: 'tile' };
    const missing = renderWithStore(
      <AssetImage assetId="oracle-portrait" className={classes.absent} />,
      { assets: loaded },
    );

    expect(missing).toContain(`<img src="${PORTRAIT}" alt="" aria-hidden="true" decoding="async"`);
    expect(missing).not.toContain('class=');
    expect(
      renderWithStore(<AssetImage assetId="oracle-portrait" className={classes.tile} />, {
        assets: loaded,
      }),
    ).toContain('class="tile"');
  });
});
