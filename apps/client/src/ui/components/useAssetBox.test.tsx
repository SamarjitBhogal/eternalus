import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { useAssetBox, useAssetBoxes } from './useAssetBox';

const PLATE = { left: 459, top: 65, width: 1002, height: 936 };
const MINI = { left: 70, top: 803, width: 102, height: 137 };

const assets = assetsSlice.reducer(
  undefined,
  assetsSlice.actions.groupUrlsChanged({
    group: 'selection',
    urls: { 'oracle-row-plate': '/plate.webp', 'catalyst-mini@legend-mini': '/mini.webp' },
    boxes: { 'oracle-row-plate': PLATE, 'catalyst-mini@legend-mini': MINI },
  }),
);

/** Renders what `useAssetBox` returns, so the hook is read through the store like a component. */
function OneBox(props: {
  readonly assetId: AssetId | null;
  readonly rendition?: RenditionKey;
}): ReactElement {
  return <output>{JSON.stringify(useAssetBox(props.assetId, props.rendition))}</output>;
}

/** Renders what `useAssetBoxes` returns for the catalyst mini, a missing mini and no art. */
function ManyBoxes(): ReactElement {
  const boxes = useAssetBoxes([
    { assetId: 'catalyst-mini', rendition: 'legend-mini' },
    { assetId: 'oracle-mini', rendition: 'legend-mini' },
    { assetId: null },
  ]);
  return <output>{JSON.stringify(boxes)}</output>;
}

/** The markup `OneBox` or `ManyBoxes` renders for `value`. */
const shown = (value: unknown): string =>
  `<output>${JSON.stringify(value).replace(/"/g, '&quot;')}</output>`;

describe('useAssetBox', () => {
  it("reads a file's draw box from the store, by id or by rendition", () => {
    expect(renderWithStore(<OneBox assetId="oracle-row-plate" />, { assets })).toBe(shown(PLATE));
    expect(
      renderWithStore(<OneBox assetId="catalyst-mini" rendition="legend-mini" />, { assets }),
    ).toBe(shown(MINI));
  });

  it('is null for no art, a file without a box, or before its group loads', () => {
    const empty = assetsSlice.getInitialState();

    expect(renderWithStore(<OneBox assetId={null} />, { assets })).toBe(shown(null));
    expect(renderWithStore(<OneBox assetId="catalyst-mini" />, { assets })).toBe(shown(null));
    expect(renderWithStore(<OneBox assetId="oracle-row-plate" />, { assets: empty })).toBe(
      shown(null),
    );
  });

  it('reads a list of boxes in order, null where there is none', () => {
    expect(renderWithStore(<ManyBoxes />, { assets })).toBe(shown([MINI, null, null]));
  });
});
