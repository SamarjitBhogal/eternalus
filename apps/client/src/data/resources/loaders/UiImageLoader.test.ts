import { describe, expect, it } from 'vitest';

import type { FontEntry, UiImageEntry } from '../AssetManifest.types';
import { describeAssetLoader } from './AssetLoader.contract';
import { UiImageLoader } from './UiImageLoader';
import type { DecodableImage } from './UiImageLoader.types';

const ENTRY: UiImageEntry = {
  id: 'test-image',
  type: 'ui-image',
  group: 'selection',
  file: { url: '/assets/test-image.webp', bytes: 10, hash: 'a'.repeat(64) },
  licence: 'owner',
  source: 'test fixture',
};

/** How a fake image behaves once its `src` is set. */
type Outcome = { readonly decodes: boolean; readonly naturalWidth: number };

/** An `HTMLImageElement` stand-in whose decode result depends on its `src`. */
function fakeImage(outcomes: Readonly<Record<string, Outcome>>): DecodableImage {
  let src = '';
  return {
    get src() {
      return src;
    },
    set src(value: string) {
      src = value;
    },
    get complete() {
      return src !== '';
    },
    get naturalWidth() {
      return outcomes[src]?.naturalWidth ?? 0;
    },
    decode: () =>
      outcomes[src]?.decodes === true ? Promise.resolve() : Promise.reject(new Error('decode')),
  };
}

const GOOD: Outcome = { decodes: true, naturalWidth: 60 };
const BROKEN: Outcome = { decodes: false, naturalWidth: 0 };
const SAFARI_SVG: Outcome = { decodes: false, naturalWidth: 50 };

describeAssetLoader('UiImageLoader', () => ({
  loader: new UiImageLoader({
    createImage: () => fakeImage({ '/good.webp': GOOD, '/bad.webp': BROKEN }),
  }),
  goodEntry: ENTRY,
  goodUrl: '/good.webp',
  badEntry: ENTRY,
  badUrl: '/bad.webp',
  isHeld: (image) => image.src !== '',
}));

describe('UiImageLoader', () => {
  it('sets the image source to the url and resolves after decode', async () => {
    const loader = new UiImageLoader({ createImage: () => fakeImage({ '/a.webp': GOOD }) });

    const image = await loader.load(ENTRY, '/a.webp');

    expect(image.src).toBe('/a.webp');
  });

  it('counts an image whose decode rejects but which did load (the Safari quirk)', async () => {
    const loader = new UiImageLoader({ createImage: () => fakeImage({ '/a.svg': SAFARI_SVG }) });

    const image = await loader.load(ENTRY, '/a.svg');

    expect(image.naturalWidth).toBe(50);
  });

  it('rejects when decode rejects and the image has no width', async () => {
    const loader = new UiImageLoader({ createImage: () => fakeImage({ '/a.webp': BROKEN }) });

    await expect(loader.load(ENTRY, '/a.webp')).rejects.toThrow(
      'image "test-image" failed to load from /a.webp',
    );
  });

  it('rejects an entry of another type', async () => {
    const loader = new UiImageLoader({ createImage: () => fakeImage({}) });
    const font: FontEntry = { ...ENTRY, type: 'font', family: 'Test', weight: '400' };

    await expect(loader.load(font, '/a.woff2')).rejects.toThrow(
      'UiImageLoader cannot load the font entry "test-image"',
    );
  });
});
