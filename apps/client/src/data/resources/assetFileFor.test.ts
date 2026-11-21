import { describe, expect, it } from 'vitest';

import { assetFileFor } from './assetFileFor';
import type { AssetFile, UiImageEntry } from './AssetManifest.types';

const FILE_1X: AssetFile = { url: '/a.webp', bytes: 10, hash: 'a'.repeat(64) };
const FILE_2X: AssetFile = { url: '/a@2x.webp', bytes: 30, hash: 'b'.repeat(64) };
const TILE_1X: AssetFile = { url: '/a@ally-tile.webp', bytes: 5, hash: 'c'.repeat(64) };
const TILE_2X: AssetFile = { url: '/a@ally-tile@2x.webp', bytes: 15, hash: 'd'.repeat(64) };

const ENTRY: UiImageEntry = {
  id: 'a',
  type: 'ui-image',
  group: 'selection',
  file: FILE_1X,
  file2x: FILE_2X,
  licence: 'owner',
  source: 'test fixture',
  renditions: { 'ally-tile': { file: TILE_1X, file2x: TILE_2X }, mirrored: { file: TILE_1X } },
};

describe('assetFileFor', () => {
  it('uses the 1x file at a pixel ratio of 1', () => {
    expect(assetFileFor(ENTRY, 1)).toBe(FILE_1X);
  });

  it('uses the 2x file above a pixel ratio of 1 when there is one', () => {
    expect(assetFileFor(ENTRY, 2)).toBe(FILE_2X);
  });

  it('falls back to the 1x file above a pixel ratio of 1 when there is no 2x file', () => {
    expect(assetFileFor({ file: FILE_1X }, 2)).toBe(FILE_1X);
  });

  it('chooses a rendition file the same way', () => {
    const tile = ENTRY.renditions?.['ally-tile'];
    const mirrored = ENTRY.renditions?.mirrored;

    expect(
      [tile, mirrored].map((files) =>
        files === undefined ? null : [assetFileFor(files, 1), assetFileFor(files, 2)],
      ),
    ).toEqual([
      [TILE_1X, TILE_2X],
      [TILE_1X, TILE_1X],
    ]);
  });
});
