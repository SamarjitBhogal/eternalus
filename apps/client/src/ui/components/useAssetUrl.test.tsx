import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
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

  it('finds the URL whichever group loaded it', () => {
    const match = assetsSlice.reducer(
      loaded,
      assetsSlice.actions.groupUrlsChanged({
        group: 'match',
        urls: { 'tower-icon': '/assets/tower-icon.webp' },
        boxes: {},
      }),
    );

    expect(
      renderWithStore(<UrlProbe assetId="tower-icon" rendition={null} />, { assets: match }),
    ).toBe('<output>/assets/tower-icon.webp</output>');
    expect(
      renderWithStore(<UrlProbe assetId="tower-icon" rendition={null} />, { assets: loaded }),
    ).toBe('<output>none</output>');
  });
});
