import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../bridge/slices/assetsSlice';
import { AssetImage } from './components/AssetImage';
import { buttonNames, renderWithStore } from './testStore';

describe('buttonNames', () => {
  it('still reads each button’s text content', () => {
    expect(buttonNames('<button>A</button><button type="button"><b>B</b></button>')).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('renderWithStore', () => {
  it('loads every asset TEST_CONTENT names, with a URL per rendition', () => {
    const portrait = renderWithStore(
      createElement(AssetImage, { assetId: 'oracle-portrait', rendition: 'ally-tile' }),
    );
    const minimap = renderWithStore(createElement(AssetImage, { assetId: 'minimap-frame' }));
    const unnamed = renderWithStore(createElement(AssetImage, { assetId: 'not-in-test-content' }));

    expect(portrait).toContain('src="/assets/test/oracle-portrait@ally-tile.webp"');
    expect(minimap).toContain('src="/assets/test/minimap-frame.webp"');
    expect(unnamed).toBe('');
  });

  it('starts with nothing loaded when the test passes an empty assets state', () => {
    const html = renderWithStore(createElement(AssetImage, { assetId: 'oracle-portrait' }), {
      assets: assetsSlice.getInitialState(),
    });

    expect(html).toBe('');
  });
});
