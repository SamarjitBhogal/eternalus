import { describe, expect, it } from 'vitest';

import { ASSET_MANIFEST } from './AssetManifest';
import type { AssetGroup } from './AssetManifest.types';
import { FontLoader } from './loaders/FontLoader';
import type { LoadableFace } from './loaders/FontLoader.types';
import { UiImageLoader } from './loaders/UiImageLoader';
import { ResourceController } from './ResourceController';

/** Byte totals per group at a pixel ratio of 1 and 2: the HC-Q15 budgets accepted by OD-7. */
const BUDGETS: readonly (readonly [AssetGroup, number, number])[] = [
  ['boot', 25_888, 25_888],
  // OD-44: the three Legend minis (49,506 / 118,376 B) move from selection-primary to selection (DEC-109).
  ['selection', 4_105_368, 2_023_392],
  ['selection-primary', 746_408, 747_230],
  ['selection-alternate', 456_024, 587_480],
  ['selection-raster', 867_022, 243_798],
  ['selection-primary-raster', 1_041_660, 281_268],
  // OD-28: the battle axe with the owner's Noise grain, +206 B (1x) and +1,322 B (2x) on OD-7's 141,440 / 358,580.
  ['match', 141_646, 359_902],
];

/** The shipped manifest behind the browser adapters, with fake images and font faces. */
function shippedResources(pixelRatio: number) {
  const faces = new Set<LoadableFace>();
  const resources = new ResourceController({
    manifest: ASSET_MANIFEST,
    loaders: [
      new UiImageLoader({
        createImage: () => ({
          src: '',
          complete: true,
          naturalWidth: 1,
          decode: () => Promise.resolve(),
        }),
      }),
      new FontLoader<LoadableFace>({
        createFace: () => ({ load: () => Promise.resolve() }),
        fonts: { add: (face) => faces.add(face), delete: (face) => faces.delete(face) },
      }),
    ],
    pixelRatio: () => pixelRatio,
    warn: () => undefined,
  });
  return { resources, faces };
}

describe('ResourceController with the shipped manifest', () => {
  it('totals each group at the budgets accepted for HC-Q15 (OD-7), at both densities', () => {
    const atDpr1 = shippedResources(1).resources;
    const atDpr2 = shippedResources(2).resources;

    const totals = BUDGETS.map(([group]) => [
      group,
      atDpr1.progress(group).totalBytes,
      atDpr2.progress(group).totalBytes,
    ]);

    expect(totals).toEqual(BUDGETS);
  });

  it('registers the Cinzel face with the boot group', async () => {
    const { resources, faces } = shippedResources(1);

    const outcome = await resources.load('boot', () => undefined);

    expect({ outcome, faces: faces.size, isLoaded: resources.isLoaded('boot') }).toEqual({
      outcome: { group: 'boot', failed: [] },
      faces: 1,
      isLoaded: true,
    });
  });

  it('serves a URL for every image entry and rendition of a loaded group', async () => {
    const { resources } = shippedResources(1);

    await resources.load('selection', () => undefined);

    const expected = ASSET_MANIFEST.assets.flatMap((entry) =>
      entry.type === 'ui-image' && entry.group === 'selection'
        ? [entry.id, ...Object.keys(entry.renditions ?? {}).map((key) => `${entry.id}@${key}`)]
        : [],
    );
    expect(Object.keys(resources.urls('selection')).sort()).toEqual(expected.sort());
    expect(expected).toContain('catalyst-card-art@refraction-picked');
  });

  it("hands out each group's draw boxes, keyed like its URLs, the same before and after a load", async () => {
    const { resources } = shippedResources(1);
    const before = resources.boxes('selection');

    await resources.load('selection', () => undefined);

    expect(resources.boxes('selection-raster')).toEqual({
      'lock-in-chrome': { left: 754, top: 890, width: 411, height: 156 },
      'oracle-row-plate': { left: 459, top: 65, width: 1002, height: 936 },
    });
    expect(resources.boxes('selection')).toEqual(before);
    expect(Object.keys(before)).toEqual(
      expect.arrayContaining([
        'catalyst-mini@legend-mini',
        'necromancer-mini@legend-mini',
        'oracle-mini@legend-mini',
        'oracle-card-art@card-picked',
      ]),
    );
    expect(resources.boxes('selection-primary')).toEqual({});
    expect(resources.boxes('boot')).toEqual({});
  });
});
