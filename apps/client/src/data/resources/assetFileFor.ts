import type { AssetFile, RenditionFiles } from './AssetManifest.types';

/**
 * The file to use at `pixelRatio` (14 §14): `file2x` above 1 when it exists, else `file`. Takes an
 * entry or one of its renditions, which share the `file`/`file2x` shape.
 */
export function assetFileFor(files: RenditionFiles, pixelRatio: number): AssetFile {
  return pixelRatio > 1 && files.file2x !== undefined ? files.file2x : files.file;
}
