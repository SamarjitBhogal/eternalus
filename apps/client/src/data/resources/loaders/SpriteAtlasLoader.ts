import type { AssetManifestEntry } from '../AssetManifest.types';
import { SpriteAtlasAsset } from '../SpriteAtlasAsset';
import type { AssetLoader } from './AssetLoader';

/** Decodes world sprite atlases using the browser bitmap adapter supplied at boot. */
export class SpriteAtlasLoader implements AssetLoader<SpriteAtlasAsset> {
  public readonly type = 'sprite-atlas';
  /** The injected decoder owns network access; tests supply in-memory bitmaps. */
  public constructor(private readonly decode: (url: string) => Promise<ImageBitmap>) {}
  /** Validates frame geometry once at the asset boundary. */
  public async load(entry: AssetManifestEntry, url: string): Promise<SpriteAtlasAsset> {
    if (entry.type !== this.type)
      throw new Error('SpriteAtlasLoader requires a sprite-atlas entry');
    const image = await this.decode(url);
    if (
      entry.columns < 1 ||
      entry.rows < 1 ||
      !Number.isInteger(entry.columns) ||
      !Number.isInteger(entry.rows) ||
      image.width % entry.columns !== 0 ||
      image.height % entry.rows !== 0
    ) {
      image.close();
      throw new Error(`Invalid sprite grid: ${entry.id}`);
    }
    return new SpriteAtlasAsset(image, entry.columns, entry.rows);
  }
  /** Releases decoded GPU/bitmap storage. */
  public release(atlas: SpriteAtlasAsset): void {
    atlas.image.close();
  }
}
