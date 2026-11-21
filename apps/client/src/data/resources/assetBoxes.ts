import type { AssetManifestEntry, RasterBox } from './AssetManifest.types';

/**
 * The draw boxes `entries` declare, keyed like `ResourceController.urls`: an entry's own box by
 * its `id`, a rendition's by `id@rendition`. A file without a box, and a font, has no key.
 */
export function assetBoxes(
  entries: readonly AssetManifestEntry[],
): Readonly<Record<string, RasterBox>> {
  const boxes: Record<string, RasterBox> = {};
  for (const entry of entries) {
    if (entry.type !== 'ui-image') continue;
    if (entry.box !== undefined) boxes[entry.id] = entry.box;
    for (const [key, files] of Object.entries(entry.renditions ?? {})) {
      if (files.box !== undefined) boxes[`${entry.id}@${key}`] = files.box;
    }
  }
  return boxes;
}
