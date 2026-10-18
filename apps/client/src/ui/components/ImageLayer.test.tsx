import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import { renderWithStore } from '../testStore';
import { ImageLayer } from './ImageLayer';

const LAYER = { kind: 'image', assetId: 'selection-backdrop' } as const;

describe('ImageLayer', () => {
  it('draws the image its asset id resolves to in the store', () => {
    const assets = assetsSlice.reducer(
      undefined,
      assetsSlice.actions.groupUrlsChanged({
        group: 'selection',
        urls: { 'selection-backdrop': '/assets/selection-backdrop.webp' },
      }),
    );
    const html = renderWithStore(<ImageLayer layer={LAYER} />, { assets });
    expect(html).toContain('background-image:url(&quot;/assets/selection-backdrop.webp&quot;)');
  });

  it('renders its layer with no image until the URL is in the store', () => {
    const html = renderWithStore(<ImageLayer layer={LAYER} />);
    expect(html).toMatch(/^<div class="[^"]+"><\/div>$/);
    expect(html).not.toContain('background-image');
  });
});
