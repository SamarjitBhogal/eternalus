/**
 * Test support: the shipped sprite sheets as a renderer holds them (DEC-398, card PR170 (8): the
 * feet are the sheet's own data). Imported only by tests.
 */
import { ASSET_MANIFEST } from '../../data/resources/AssetManifest';
import type { AtlasShape } from '../engine/render/Renderer.types';

/** The 1x image size of a shipped Legend sheet: 6 x 10 cells of 64 x 64 px. */
const SHEET_IMAGE = { width: 384, height: 640 } as const;

/** The shapes of the shipped sheets `atlasIds` by manifest id: the manifest's grid and feet. */
export const shapesOf = (...atlasIds: readonly string[]): Readonly<Record<string, AtlasShape>> =>
  Object.fromEntries(
    ASSET_MANIFEST.assets.flatMap((entry) =>
      entry.type === 'sprite-atlas' && atlasIds.includes(entry.id)
        ? [[entry.id, { ...entry, image: SHEET_IMAGE }] as const]
        : [],
    ),
  );
