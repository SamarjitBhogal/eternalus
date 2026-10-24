import type { AssetManifestEntry } from '../AssetManifest.types';
import type { AssetLoader } from './AssetLoader';
import type { DecodableImage, UiImageLoaderDeps } from './UiImageLoader.types';

/**
 * Loads `ui-image` assets (DV-39): sets `src`, awaits `decode()` (off the main thread where the
 * browser can), and keeps the element so the decoded bitmap stays cached for the `<img>` that
 * renders the same URL. A rejected `decode()` on an image that did load (`complete &&
 * naturalWidth > 0`, a Safari SVG quirk) still counts as loaded.
 */
export class UiImageLoader implements AssetLoader<DecodableImage> {
  public readonly type = 'ui-image';

  /** Builds the loader over the injected image factory (`() => new Image()` in the browser). */
  public constructor(private readonly deps: UiImageLoaderDeps) {}

  /**
   * Decodes `url`.
   * @throws Error (as a rejection) when `entry` is not a `ui-image` entry or the image fails.
   */
  public async load(entry: AssetManifestEntry, url: string): Promise<DecodableImage> {
    if (entry.type !== this.type) {
      throw new Error(`UiImageLoader cannot load the ${entry.type} entry "${entry.id}"`);
    }
    const image = this.deps.createImage();
    image.src = url;
    try {
      await image.decode();
    } catch (error) {
      if (!image.complete || image.naturalWidth === 0) {
        throw new Error(`image "${entry.id}" failed to load from ${url}`, { cause: error });
      }
    }
    return image;
  }

  /**
   * Drops the element's image so the browser can free the decoded bitmap now rather than at
   * garbage collection; an `<img>` that shows the same URL keeps its own copy.
   */
  public release(image: DecodableImage): void {
    image.src = '';
  }
}
