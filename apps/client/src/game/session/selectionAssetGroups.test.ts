import { describe, expect, it } from 'vitest';

import { SELECTION_ASSET_GROUPS, selectionAssetGroups } from './selectionAssetGroups';

describe('selectionAssetGroups', () => {
  it('loads selection, the layout group, then the plates of the raster renderer only', () => {
    expect(selectionAssetGroups('primary', 'figma-raster')).toEqual([
      'selection',
      'selection-primary',
      'selection-raster',
      'selection-primary-raster',
    ]);
    expect(selectionAssetGroups('primary', 'css')).toEqual(['selection', 'selection-primary']);
    expect(selectionAssetGroups('alternate', 'figma-raster')).toEqual([
      'selection',
      'selection-alternate',
      'selection-raster',
    ]);
    expect(selectionAssetGroups('alternate', 'css')).toEqual(['selection', 'selection-alternate']);
  });

  it('lists every selection group once, in release order', () => {
    expect(SELECTION_ASSET_GROUPS).toEqual([
      'selection',
      'selection-primary',
      'selection-alternate',
      'selection-raster',
      'selection-primary-raster',
    ]);
    const loaded = (['primary', 'alternate'] as const).flatMap((layout) =>
      (['figma-raster', 'css'] as const).flatMap((renderer) =>
        selectionAssetGroups(layout, renderer),
      ),
    );
    expect(new Set(SELECTION_ASSET_GROUPS)).toEqual(new Set(loaded));
  });
});
