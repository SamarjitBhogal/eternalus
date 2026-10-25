import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { AssetImage } from './AssetImage';
import { useAssetUrl } from './useAssetUrl';

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

/** Renders what `useAssetUrl` returns, so the hook is read through the store like a component. */
function UrlProbe({
  assetId,
  rendition,
}: {
  readonly assetId: AssetId | null;
  readonly rendition: RenditionKey | null;
}): ReactElement {
  const url = useAssetUrl(assetId, rendition ?? undefined);
  return <output>{url ?? 'none'}</output>;
}

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

describe('useAssetUrl', () => {
  it('gives null before load and for a null id, the rendition URL first, then the asset URL', () => {
    const probe = (assetId: AssetId | null, rendition: RenditionKey | null, assets = loaded) =>
      renderWithStore(<UrlProbe assetId={assetId} rendition={rendition} />, { assets });

    expect(probe('oracle-portrait', null, empty)).toBe('<output>none</output>');
    expect(probe(null, 'ally-tile')).toBe('<output>none</output>');
    expect(probe('oracle-portrait', 'ally-tile')).toBe(`<output>${PORTRAIT_TILE}</output>`);
    expect(probe('oracle-portrait', 'legend-mini')).toBe(`<output>${PORTRAIT}</output>`);
    expect(probe('oracle-portrait', null)).toBe(`<output>${PORTRAIT}</output>`);
  });
});
