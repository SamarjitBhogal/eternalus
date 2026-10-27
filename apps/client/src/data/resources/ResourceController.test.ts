import { describe, expect, it, vi } from 'vitest';

import type { AssetFile, AssetManifestEntry } from './AssetManifest.types';
import { FakeAssetLoader } from './loaders/FakeAssetLoader';
import { ResourceController } from './ResourceController';
import type { LoadProgress, ResourceControllerDeps } from './ResourceController.types';

/** A file named `url` with `bytes` bytes (the hash is not read by the controller). */
function file(url: string, bytes: number): AssetFile {
  return { url, bytes, hash: '0'.repeat(64) };
}

const FONT: AssetManifestEntry = {
  id: 'font-a',
  type: 'font',
  group: 'boot',
  family: 'Test',
  weight: '400',
  file: file('/font-a.woff2', 100),
  licence: 'ofl-cinzel',
  source: 'test fixture',
};
const IMAGE_A: AssetManifestEntry = {
  id: 'img-a',
  type: 'ui-image',
  group: 'selection',
  file: file('/img-a.webp', 10),
  file2x: file('/img-a@2x.webp', 40),
  licence: 'owner',
  source: 'test fixture',
  renditions: {
    'ally-tile': {
      file: file('/img-a@ally-tile.webp', 5),
      file2x: file('/img-a@ally-tile@2x.webp', 20),
    },
    mirrored: { file: file('/img-a@mirrored.webp', 6) },
  },
};
const IMAGE_B: AssetManifestEntry = {
  id: 'img-b',
  type: 'ui-image',
  group: 'selection',
  file: file('/img-b.webp', 20),
  licence: 'owner',
  source: 'test fixture',
};
const CARD = { file: file('/img-c@card-idle.webp', 7) };
/** An entry whose own file is one of its renditions (every use has a rendition). */
const IMAGE_C: AssetManifestEntry = {
  id: 'img-c',
  type: 'ui-image',
  group: 'selection',
  ...CARD,
  licence: 'owner',
  source: 'test fixture',
  renditions: { 'card-idle': CARD, 'card-picked': { file: file('/img-c@card-picked.webp', 9) } },
};
const IMAGE_M: AssetManifestEntry = {
  ...IMAGE_B,
  id: 'img-m',
  group: 'match',
  file: file('/img-m.webp', 30),
};

const MANIFEST = { version: 'test', assets: [FONT, IMAGE_A, IMAGE_B, IMAGE_C, IMAGE_M] };
/** The selection group at a pixel ratio of 1: img-a 10 + 5 + 6, img-b 20, img-c 7 + 9. */
const SELECTION_BYTES_1X = 57;

/** A controller over fake loaders, with the warnings it reported (none when `warn` is given). */
function setup(
  options: {
    failingUrls?: readonly string[];
    failingFontUrls?: readonly string[];
    pixelRatio?: number;
    assets?: readonly AssetManifestEntry[];
    warn?: ResourceControllerDeps['warn'];
  } = {},
) {
  const images = new FakeAssetLoader({ failingUrls: options.failingUrls ?? [] });
  const fonts = new FakeAssetLoader({ type: 'font', failingUrls: options.failingFontUrls ?? [] });
  const warnings: { body: string; attributes: unknown }[] = [];
  const resources = new ResourceController({
    manifest: { ...MANIFEST, assets: options.assets ?? MANIFEST.assets },
    loaders: [images, fonts],
    pixelRatio: () => options.pixelRatio ?? 1,
    warn: options.warn ?? ((body, attributes) => warnings.push({ body, attributes })),
  });
  return { resources, images, fonts, warnings };
}

/** A `warn` that throws on its first call, as a bug would, and then reports nothing. */
function warnThatThrowsOnce(): ResourceControllerDeps['warn'] {
  let isBroken = true;
  return () => {
    if (isBroken) {
      isBroken = false;
      throw new Error('warn bug');
    }
  };
}

describe('ResourceController', () => {
  it('reports monotonic byte progress that ends at the group sum, and counts loaded assets', async () => {
    const { resources, images } = setup();
    const reports: LoadProgress[] = [];

    const load = resources.load('selection', (progress) => reports.push(progress));
    images.resolveAll();
    const outcome = await load;

    const bytes = reports.map((report) => report.loadedBytes);
    expect(bytes).toEqual([...bytes].sort((a, b) => a - b));
    expect(reports.at(-1)).toEqual({
      group: 'selection',
      loaded: 3,
      total: 3,
      loadedBytes: SELECTION_BYTES_1X,
      totalBytes: SELECTION_BYTES_1X,
    });
    expect(outcome).toEqual({ group: 'selection', failed: [] });
  });

  it('lists a failed asset, warns once with its id, and still loads the others', async () => {
    const { resources, images, warnings } = setup({ failingUrls: ['/img-b.webp'] });

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    const outcome = await load;

    expect(outcome.failed).toEqual(['img-b']);
    expect(warnings).toEqual([
      {
        body: 'asset failed',
        attributes: {
          assetId: 'img-b',
          url: '/img-b.webp',
          error: 'fake load of /img-b.webp failed',
        },
      },
    ]);
    expect(Object.keys(resources.urls('selection')).sort()).toEqual([
      'img-a',
      'img-a@ally-tile',
      'img-a@mirrored',
      'img-c',
      'img-c@card-idle',
      'img-c@card-picked',
    ]);
    expect(resources.isLoaded('selection')).toBe(false);
  });

  it('warns once for a failed rendition and serves its key with the entry url', async () => {
    const { resources, images, warnings } = setup({ failingUrls: ['/img-a@ally-tile.webp'] });

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    const outcome = await load;

    expect(outcome.failed).toEqual([]);
    expect(warnings).toEqual([
      {
        body: 'asset rendition failed',
        attributes: {
          assetId: 'img-a',
          url: '/img-a@ally-tile.webp',
          error: 'fake load of /img-a@ally-tile.webp failed',
          rendition: 'ally-tile',
        },
      },
    ]);
    expect(resources.urls('selection')['img-a@ally-tile']).toBe('/img-a.webp');
    expect(resources.progress('selection').loadedBytes).toBe(SELECTION_BYTES_1X - 5);
  });

  it('never lowers byte progress when an entry fails after its renditions loaded', async () => {
    const { resources, images } = setup({ failingUrls: ['/img-a.webp'] });
    const bytes: number[] = [];

    const load = resources.load('selection', (progress) => bytes.push(progress.loadedBytes));
    images.resolveAll();
    await load;
    bytes.push(resources.progress('selection').loadedBytes);

    expect(bytes).toEqual([...bytes].sort((a, b) => a - b));
    // img-a's own file (10) and its renditions (5 + 6) are not loaded bytes.
    expect(bytes.at(-1)).toBe(SELECTION_BYTES_1X - (10 + 5 + 6));
  });

  it('serves id and id@rendition keys, loading a file shared by an entry and a rendition once', async () => {
    const { resources, images } = setup();

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    await load;

    expect(resources.urls('selection')).toEqual({
      'img-a': '/img-a.webp',
      'img-a@ally-tile': '/img-a@ally-tile.webp',
      'img-a@mirrored': '/img-a@mirrored.webp',
      'img-b': '/img-b.webp',
      'img-c': '/img-c@card-idle.webp',
      'img-c@card-idle': '/img-c@card-idle.webp',
      'img-c@card-picked': '/img-c@card-picked.webp',
    });
    expect(images.calls.map((call) => call.url)).toEqual([
      '/img-a.webp',
      '/img-a@ally-tile.webp',
      '/img-a@mirrored.webp',
      '/img-b.webp',
      '/img-c@card-idle.webp',
      '/img-c@card-picked.webp',
    ]);
  });

  it('picks the 2x files and their bytes at a pixel ratio of 2, falling back to the 1x file', async () => {
    const { resources, images } = setup({ pixelRatio: 2 });

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    await load;

    expect(resources.urls('selection')).toMatchObject({
      'img-a': '/img-a@2x.webp',
      'img-a@ally-tile': '/img-a@ally-tile@2x.webp',
      'img-a@mirrored': '/img-a@mirrored.webp',
      'img-b': '/img-b.webp',
    });
    expect(resources.progress('selection').totalBytes).toBe(40 + 20 + 6 + 20 + 7 + 9);
  });

  it('loads each file once for two concurrent loads and reports to both listeners', async () => {
    const { resources, images } = setup();
    const first: number[] = [];
    const second: number[] = [];

    const a = resources.load('selection', (progress) => first.push(progress.loadedBytes));
    const b = resources.load('selection', (progress) => second.push(progress.loadedBytes));
    images.resolveAll();
    await Promise.all([a, b]);

    expect(a).toBe(b);
    expect(images.calls).toHaveLength(6);
    expect([first.at(-1), second.at(-1)]).toEqual([SELECTION_BYTES_1X, SELECTION_BYTES_1X]);
  });

  it('turns isLoaded true once a group has loaded, and resolves a loaded group at once', async () => {
    const { resources, images } = setup();
    const before = resources.isLoaded('selection');

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    await load;
    const reports: LoadProgress[] = [];
    const again = await resources.load('selection', (progress) => reports.push(progress));

    expect({ before, after: resources.isLoaded('selection'), again, reports }).toEqual({
      before: false,
      after: true,
      again: { group: 'selection', failed: [] },
      reports: [],
    });
    expect(images.calls).toHaveLength(6);
  });

  it('treats an empty group as loaded', () => {
    const { resources } = setup({ assets: [FONT] });

    expect([
      resources.isLoaded('selection-alternate'),
      resources.urls('selection-alternate'),
    ]).toEqual([true, {}]);
  });

  it('lists only loaded ui-image entries of the asked group in urls', async () => {
    const { resources, fonts } = setup();

    const load = resources.load('boot', () => undefined);
    fonts.resolveAll();
    await load;

    expect([resources.isLoaded('boot'), resources.urls('boot'), resources.urls('match')]).toEqual([
      true,
      {},
      {},
    ]);
  });

  it('releases every handle of a group, empties its urls and marks it unloaded', async () => {
    const { resources, images } = setup();
    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    await load;
    const heldBefore = images.heldCount;

    resources.release('selection');

    expect({
      heldBefore,
      heldAfter: images.heldCount,
      urls: resources.urls('selection'),
      isLoaded: resources.isLoaded('selection'),
      loaded: resources.progress('selection').loaded,
    }).toEqual({ heldBefore: 6, heldAfter: 0, urls: {}, isLoaded: false, loaded: 0 });
  });

  it('keeps nothing from a load still running when its group is released', async () => {
    const { resources, images } = setup();
    const reports: LoadProgress[] = [];

    const load = resources.load('selection', (progress) => reports.push(progress));
    resources.release('selection');
    images.resolveAll();
    await load;

    expect({
      urls: resources.urls('selection'),
      reports,
      held: images.heldCount,
      isLoaded: resources.isLoaded('selection'),
    }).toEqual({ urls: {}, reports: [], held: 0, isLoaded: false });
  });

  it('starts a fresh load after a release while the old load was still running', async () => {
    const { resources, images } = setup();
    const stale = resources.load('selection', () => undefined);
    resources.release('selection');

    const fresh = resources.load('selection', () => undefined);
    images.resolveAll();
    await Promise.all([stale, fresh]);

    expect(fresh).not.toBe(stale);
    expect(resources.isLoaded('selection')).toBe(true);
    expect(images.calls).toHaveLength(12);
  });

  it('starts a fresh load after a group load rejected (a bug), and that load resolves', async () => {
    const { resources, images } = setup({
      failingUrls: ['/img-b.webp'],
      warn: warnThatThrowsOnce(),
    });
    const rejected = resources.load('selection', () => undefined);
    images.resolveAll();
    await expect(rejected).rejects.toThrow('warn bug');

    const retry = resources.load('selection', () => undefined);
    images.resolveAll();

    expect(retry).not.toBe(rejected);
    await expect(retry).resolves.toEqual({ group: 'selection', failed: ['img-b'] });
    expect(images.calls.map((call) => call.url).at(-1)).toBe('/img-b.webp');
    // img-a and img-c loaded before the rejection: kept, so the retry asks only for img-b again.
    expect(images.calls).toHaveLength(7);
    const heldAfterRetry = images.heldCount;
    resources.release('selection');
    expect({ heldAfterRetry, heldAfterRelease: images.heldCount }).toEqual({
      heldAfterRetry: 5,
      heldAfterRelease: 0,
    });
  });

  it('frees the entries a rejected group load was still loading, so a retry loads them once and leaks nothing', async () => {
    const { resources, images, fonts } = setup({
      assets: [FONT, { ...IMAGE_A, group: 'boot' }],
      failingFontUrls: ['/font-a.woff2'],
      warn: warnThatThrowsOnce(),
    });
    const rejected = resources.load('boot', () => undefined);
    fonts.resolveAll();
    await expect(rejected).rejects.toThrow('warn bug');

    // img-a's three files are still loading for the rejected load when the retry starts.
    const retry = resources.load('boot', () => undefined);
    fonts.resolveAll();
    images.resolveAll();
    await expect(retry).resolves.toEqual({ group: 'boot', failed: ['font-a'] });

    // Each file once for the rejected load (its handles freed) and once for the retry (kept).
    const imgA = ['/img-a.webp', '/img-a@ally-tile.webp', '/img-a@mirrored.webp'];
    expect(images.calls.map((call) => call.url)).toEqual([...imgA, ...imgA]);
    expect(fonts.calls).toHaveLength(2);
    const heldAfterRetry = images.heldCount;
    resources.release('boot');
    expect({ heldAfterRetry, heldAfterRelease: images.heldCount }).toEqual({
      heldAfterRetry: 3,
      heldAfterRelease: 0,
    });
  });

  it('keeps the fresh load when a released load it replaced rejects later (a bug)', async () => {
    const { resources, images, fonts } = setup({ assets: [FONT, { ...IMAGE_A, group: 'boot' }] });
    const stale = resources.load('boot', () => undefined);
    resources.release('boot');
    const fresh = resources.load('boot', () => undefined);
    vi.spyOn(images, 'release').mockImplementationOnce(() => {
      throw new Error('release bug');
    });

    images.resolveAll();
    await expect(stale).rejects.toThrow('release bug');
    // The fresh load's font is still loading when the stale load rejects.
    fonts.resolveAll();

    await expect(fresh).resolves.toEqual({ group: 'boot', failed: [] });
    expect(resources.isLoaded('boot')).toBe(true);
  });

  it('frees the renditions an entry loaded when warning that its own file failed throws (a bug)', async () => {
    const { resources, images } = setup({
      assets: [FONT, IMAGE_A],
      failingUrls: ['/img-a.webp'],
      warn: warnThatThrowsOnce(),
    });

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    await expect(load).rejects.toThrow('warn bug');

    expect(images.calls).toHaveLength(3);
    expect(images.heldCount).toBe(0);
  });

  it('keeps an entry whose failed-rendition warning throws (a bug), so a release frees it', async () => {
    const { resources, images } = setup({
      assets: [FONT, IMAGE_A],
      failingUrls: ['/img-a@ally-tile.webp'],
      warn: warnThatThrowsOnce(),
    });

    const load = resources.load('selection', () => undefined);
    images.resolveAll();
    await expect(load).rejects.toThrow('warn bug');
    resources.release('selection');

    expect(images.heldCount).toBe(0);
  });

  it('refuses a duplicate id, a type with no loader and a font outside boot', () => {
    const build =
      (assets: readonly AssetManifestEntry[], withFonts = true) =>
      () =>
        new ResourceController({
          manifest: { version: 'test', assets },
          loaders: withFonts
            ? [new FakeAssetLoader(), new FakeAssetLoader({ type: 'font' })]
            : [new FakeAssetLoader()],
          pixelRatio: () => 1,
          warn: () => undefined,
        });

    expect(build([IMAGE_B, IMAGE_B])).toThrow('duplicate asset id "img-b"');
    expect(build([FONT], false)).toThrow('no loader for the font asset "font-a"');
    expect(build([{ ...FONT, group: 'match' }])).toThrow(
      'the font "font-a" must be in the boot group',
    );
  });
});
