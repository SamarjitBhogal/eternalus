import { describe, expect, it } from 'vitest';

import { assetBoxes } from './assetBoxes';
import type { AssetFile, AssetManifestEntry } from './AssetManifest.types';

const file = (url: string): AssetFile => ({ url, bytes: 1, hash: '0'.repeat(64) });

const PLATE: AssetManifestEntry = {
  id: 'oracle-row-plate',
  type: 'ui-image',
  group: 'selection-raster',
  file: file('/oracle-row-plate.webp'),
  licence: 'owner',
  source: 'Figma 61:3',
  box: { left: 459, top: 65, width: 1002, height: 936 },
};

const CARD_ART: AssetManifestEntry = {
  id: 'oracle-card-art',
  type: 'ui-image',
  group: 'selection',
  file: file('/oracle-card-art@card-idle.webp'),
  licence: 'owner',
  source: 'Figma 58:360',
  renditions: {
    'card-idle': {
      file: file('/oracle-card-art@card-idle.webp'),
      box: { left: 826, top: 255, width: 266, height: 568 },
    },
    'card-picked': { file: file('/oracle-card-art@card-picked.webp') },
  },
};

const FONT: AssetManifestEntry = {
  id: 'cinzel-wght',
  type: 'font',
  group: 'boot',
  file: file('/cinzel-wght.woff2'),
  licence: 'ofl-cinzel',
  source: 'https://github.com/NDISCOVER/Cinzel',
  family: 'Cinzel',
  weight: '400 700',
};

describe('assetBoxes', () => {
  it("keys an entry's box by its id and a rendition's by id@rendition, like the URLs", () => {
    expect(assetBoxes([PLATE, CARD_ART])).toEqual({
      'oracle-row-plate': { left: 459, top: 65, width: 1002, height: 936 },
      'oracle-card-art@card-idle': { left: 826, top: 255, width: 266, height: 568 },
    });
  });

  it('has no key for a file without a box, nor for a font', () => {
    const boxes = assetBoxes([CARD_ART, FONT]);

    expect(Object.keys(boxes)).toEqual(['oracle-card-art@card-idle']);
    expect(boxes['oracle-card-art']).toBeUndefined();
    expect(boxes['oracle-card-art@card-picked']).toBeUndefined();
  });
});
