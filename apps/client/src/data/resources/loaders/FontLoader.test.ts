import { describe, expect, it } from 'vitest';

import type { FontEntry, UiImageEntry } from '../AssetManifest.types';
import { describeAssetLoader } from './AssetLoader.contract';
import { FontLoader } from './FontLoader';

const FONT: FontEntry = {
  id: 'test-font',
  type: 'font',
  group: 'boot',
  family: 'Cinzel',
  weight: '400 700',
  file: { url: '/assets/test-font.woff2', bytes: 10, hash: 'a'.repeat(64) },
  licence: 'ofl-cinzel',
  source: 'test fixture',
};

/** A `FontFace` stand-in that loads unless its source names a failing url. */
type FakeFace = {
  readonly family: string;
  readonly source: string;
  readonly descriptors: FontFaceDescriptors;
  load(): Promise<unknown>;
};

/** A `FontLoader` over fakes, with the face set and the order of events it saw. */
function fakeFontLoader(failingSource = 'url("/bad.woff2")') {
  const fonts = new Set<FakeFace>();
  const events: string[] = [];
  const loader = new FontLoader<FakeFace>({
    createFace: (family, source, descriptors) => ({
      family,
      source,
      descriptors,
      load: () => {
        events.push(`load ${source}`);
        return source === failingSource ? Promise.reject(new Error('font')) : Promise.resolve();
      },
    }),
    fonts: {
      add: (face) => {
        events.push(`add ${face.source}`);
        return fonts.add(face);
      },
      delete: (face) => fonts.delete(face),
    },
  });
  return { loader, fonts, events };
}

describeAssetLoader('FontLoader', () => {
  const { loader, fonts } = fakeFontLoader();
  return {
    loader,
    goodEntry: FONT,
    goodUrl: '/good.woff2',
    badEntry: FONT,
    badUrl: '/bad.woff2',
    isHeld: (face) => fonts.has(face),
  };
});

describe('FontLoader', () => {
  it('creates the face with the entry family, a url() source and the weight', async () => {
    const { loader } = fakeFontLoader();

    const face = await loader.load(FONT, '/cinzel.woff2');

    expect({ family: face.family, source: face.source, descriptors: face.descriptors }).toEqual({
      family: 'Cinzel',
      source: 'url("/cinzel.woff2")',
      descriptors: { weight: '400 700' },
    });
  });

  it('registers the face only after it has loaded', async () => {
    const { loader, events } = fakeFontLoader();

    await loader.load(FONT, '/cinzel.woff2');

    expect(events).toEqual(['load url("/cinzel.woff2")', 'add url("/cinzel.woff2")']);
  });

  it('does not register a face that fails to load', async () => {
    const { loader, fonts } = fakeFontLoader();

    await expect(loader.load(FONT, '/bad.woff2')).rejects.toThrow('font');
    expect(fonts.size).toBe(0);
  });

  it('rejects an entry that is not a font', async () => {
    const { loader } = fakeFontLoader();
    const image: UiImageEntry = {
      id: 'test-image',
      type: 'ui-image',
      group: 'selection',
      file: FONT.file,
      licence: 'owner',
      source: 'test fixture',
    };

    await expect(loader.load(image, '/a.webp')).rejects.toThrow(
      'FontLoader cannot load the ui-image entry "test-image"',
    );
  });
});
