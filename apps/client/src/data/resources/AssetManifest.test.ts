import { describe, expect, expectTypeOf, it } from 'vitest';

import { ASSET_LICENCES } from './assetLicences';
import { ASSET_MANIFEST } from './AssetManifest';
import type { AssetFile, AssetGroup, AssetManifestEntry } from './AssetManifest.types';
import { BOOT_ASSETS } from './bootAssets';
import { MATCH_ASSETS } from './matchAssets';
import { SELECTION_ALTERNATE_ASSETS } from './selectionAlternateAssets';
import { SELECTION_ASSETS } from './selectionAssets';
import { SELECTION_PRIMARY_ASSETS } from './selectionPrimaryAssets';
import { SELECTION_PRIMARY_RASTER_ASSETS } from './selectionPrimaryRasterAssets';
import { SELECTION_RASTER_ASSETS } from './selectionRasterAssets';

/** The seven groups (I-47); a new `AssetGroup` member fails the `expectTypeOf` case until added. */
const GROUPS = [
  'boot',
  'selection',
  'selection-primary',
  'selection-alternate',
  'selection-raster',
  'selection-primary-raster',
  'match',
] as const satisfies readonly AssetGroup[];

/** Each group's file, in `ASSET_MANIFEST` order. */
const GROUP_FILES: readonly (readonly [AssetGroup, readonly AssetManifestEntry[]])[] = [
  ['boot', BOOT_ASSETS],
  ['selection', SELECTION_ASSETS],
  ['selection-primary', SELECTION_PRIMARY_ASSETS],
  ['selection-alternate', SELECTION_ALTERNATE_ASSETS],
  ['selection-raster', SELECTION_RASTER_ASSETS],
  ['selection-primary-raster', SELECTION_PRIMARY_RASTER_ASSETS],
  ['match', MATCH_ASSETS],
];

/** The WebP files, read inline as data URLs (spike S1), for their RIFF chunk. */
const INLINE_IMAGES = import.meta.glob<string>('../../assets/**/*.webp', {
  query: '?inline',
  import: 'default',
  eager: true,
});

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const assets = ASSET_MANIFEST.assets;

/** The basename of a file URL without its extension. */
function basename(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
}

/** Every file of an entry with the basename it must have. */
function namedFiles(entry: AssetManifestEntry): { file: AssetFile; names: readonly string[] }[] {
  const renditions = entry.type === 'ui-image' ? Object.entries(entry.renditions ?? {}) : [];
  const ownNames = [
    entry.id,
    ...renditions.flatMap(([key, files]) =>
      files.file.url === entry.file.url ? [`${entry.id}@${key}`] : [],
    ),
  ];
  return [
    { file: entry.file, names: ownNames },
    ...(entry.file2x === undefined
      ? []
      : [{ file: entry.file2x, names: ownNames.map((name) => `${name}@2x`) }]),
    ...renditions.flatMap(([key, files]) => [
      { file: files.file, names: [`${entry.id}@${key}`] },
      ...(files.file2x === undefined
        ? []
        : [{ file: files.file2x, names: [`${entry.id}@${key}@2x`] }]),
    ]),
  ];
}

describe('ASSET_MANIFEST', () => {
  it('has unique kebab-case ids', () => {
    const ids = assets.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !KEBAB_CASE.test(id))).toEqual([]);
  });

  it('names every file after its id, rendition and density', () => {
    const misnamed = assets.flatMap((entry) =>
      namedFiles(entry).flatMap(({ file, names }) =>
        names.includes(basename(file.url)) ? [] : [file.url],
      ),
    );

    expect(misnamed).toEqual([]);
  });

  it('gives every file a positive byte count and a lowercase hex SHA-256', () => {
    const files = assets.flatMap((entry) => namedFiles(entry).map(({ file }) => file));

    expect(files.filter((file) => !Number.isInteger(file.bytes) || file.bytes <= 0)).toEqual([]);
    expect(files.filter((file) => !/^[0-9a-f]{64}$/.test(file.hash))).toEqual([]);
  });

  it('licenses every entry and names its Figma node or download in its source', () => {
    expect(assets.filter((entry) => !(entry.licence in ASSET_LICENCES))).toEqual([]);
    expect(assets.filter((entry) => !/\b\d+:\d+\b|https:\/\//.test(entry.source))).toEqual([]);
  });

  it('names both the owner and Phosphor in the source of the arcane intellect icon', () => {
    const icon = assets.find((entry) => entry.id === 'magus-detail-arcane-intellect');

    expect(icon?.licence).toBe('mit-phosphor');
    expect(icon?.source).toMatch(/owner's head outline .*Phosphor Icons Brain glyph/);
  });

  it('keeps every font in the boot group', () => {
    expect(assets.filter((entry) => entry.type === 'font').map((entry) => entry.group)).toEqual([
      'boot',
    ]);
  });

  it('ships the licence texts, with each notice copied from its text', () => {
    const ofl = ASSET_LICENCES['ofl-cinzel'];
    const mit = ASSET_LICENCES['mit-phosphor'];

    expect(ofl.text).toContain('SIL Open Font License');
    expect(mit.text).toContain('Permission is hereby granted');
    expect([ofl.text?.includes(ofl.notice), mit.text?.includes(mit.notice)]).toEqual([true, true]);
    expect(ASSET_LICENCES.owner.text).toBeNull();
  });

  it('uses only the seven asset groups', () => {
    expectTypeOf<(typeof GROUPS)[number]>().toEqualTypeOf<AssetGroup>();
    expect(assets.filter((entry) => !(GROUPS as readonly string[]).includes(entry.group))).toEqual(
      [],
    );
  });

  it('keeps each group in exactly one group file, whose entries all carry that group', () => {
    const misplaced = GROUP_FILES.flatMap(([group, entries]) =>
      entries.filter((entry) => entry.group !== group).map((entry) => entry.id),
    );
    const filesPerGroup = GROUPS.map(
      (group) =>
        GROUP_FILES.filter(([, entries]) => entries.some((entry) => entry.group === group)).length,
    );

    expect(misplaced).toEqual([]);
    expect(filesPerGroup).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it('is the concatenation of the seven group files', () => {
    expect(assets).toEqual(GROUP_FILES.flatMap(([, entries]) => entries));
  });

  it('puts only the alternate layout art in the selection-alternate group', () => {
    expect(SELECTION_ALTERNATE_ASSETS.map((entry) => entry.id)).toEqual([
      'magus-detail-arcane-intellect-flame',
      'magus-model',
    ]);
  });

  it('puts the plates in the raster-only groups of their step', () => {
    expect(SELECTION_RASTER_ASSETS.map((entry) => entry.id)).toEqual([
      'lock-in-chrome',
      'oracle-row-plate',
    ]);
    expect(SELECTION_PRIMARY_RASTER_ASSETS.map((entry) => entry.id)).toEqual([
      'class-row-plate-magus',
      'flying-card-plate-idle',
      'magus-card-plate-picked',
      'select-class-chrome',
      'sentinel-card-plate-idle',
      'warrior-card-plate-idle',
    ]);
  });

  it('stores every 1x image file and every 1x rendition file as lossless WebP', () => {
    const urls = assets.flatMap((entry) =>
      entry.type === 'ui-image'
        ? [entry.file.url, ...Object.values(entry.renditions ?? {}).map((files) => files.file.url)]
        : [],
    );
    const lossy = urls.filter((url) => {
      const inline = INLINE_IMAGES[url.replace(/^\/src\/assets\//, '../../assets/')] ?? '';
      const header = atob(inline.slice(inline.indexOf(',') + 1, inline.indexOf(',') + 25));
      return !header.startsWith('RIFF') || header.slice(8, 16) !== 'WEBPVP8L';
    });

    expect(urls.length).toBeGreaterThan(0);
    expect(lossy).toEqual([]);
  });
});
