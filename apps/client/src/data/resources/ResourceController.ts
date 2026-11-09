import { ImageLoader } from './loaders/ImageLoader';

/** The single asset-loading facade; caches decoded images for its lifetime. */
export class ResourceController {
  private readonly images = new Map<string, Promise<HTMLImageElement>>();

  /** Accepts a loader for browser-free tests. */
  public constructor(private readonly loader: Pick<ImageLoader, 'load'> = new ImageLoader()) {}

  /** Loads once, permitting retry after a failed decode. */
  public loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.images.get(url);
    if (cached !== undefined) return cached;
    const pending = this.loader.load(url).catch((error: unknown) => {
      this.images.delete(url);
      throw error;
    });
    this.images.set(url, pending);
    return pending;
  }
}
