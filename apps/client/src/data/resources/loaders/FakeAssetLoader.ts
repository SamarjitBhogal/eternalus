import type { AssetManifestEntry, AssetType } from '../AssetManifest.types';
import type { AssetLoader } from './AssetLoader';
import type {
  FakeAssetHandle,
  FakeAssetLoaderOptions,
  FakeLoadCall,
} from './FakeAssetLoader.types';

/**
 * Test double of the loader port (02 §8): records every load and keeps it pending until
 * `resolveAll()` settles it (or settles at once when asked), so tests drive asynchronous group
 * loads without timers. Loads of a failing URL reject; release frees the handle.
 */
export class FakeAssetLoader implements AssetLoader<FakeAssetHandle> {
  public readonly type: AssetType;
  /** Every `load` call, in call order. */
  public readonly calls: FakeLoadCall[] = [];
  private readonly failingUrls: ReadonlySet<string>;
  private readonly shouldSettleAtOnce: boolean;
  private readonly held = new Set<FakeAssetHandle>();
  private pending: (() => void)[] = [];

  public constructor(options: FakeAssetLoaderOptions = {}) {
    this.type = options.type ?? 'ui-image';
    this.failingUrls = new Set(options.failingUrls ?? []);
    this.shouldSettleAtOnce = options.shouldSettleAtOnce ?? false;
  }

  /** How many loads wait for `resolveAll()`. */
  public get pendingCount(): number {
    return this.pending.length;
  }

  /** How many handles are loaded and not released. */
  public get heldCount(): number {
    return this.held.size;
  }

  /** Records the call; resolves a fresh handle (or rejects for a failing URL) when settled. */
  public load(entry: AssetManifestEntry, url: string): Promise<FakeAssetHandle> {
    this.calls.push({ entry, url });
    return new Promise((resolve, reject) => {
      const settle = (): void => {
        if (this.failingUrls.has(url)) {
          reject(new Error(`fake load of ${url} failed`));
          return;
        }
        const handle = { url };
        this.held.add(handle);
        resolve(handle);
      };
      if (this.shouldSettleAtOnce) {
        settle();
      } else {
        this.pending.push(settle);
      }
    });
  }

  /** Settles every pending load, in call order. */
  public resolveAll(): void {
    const settling = this.pending;
    this.pending = [];
    for (const settle of settling) {
      settle();
    }
  }

  /** Frees `handle`. */
  public release(handle: FakeAssetHandle): void {
    this.held.delete(handle);
  }

  /** Whether `handle` was loaded and not released. */
  public isHeld(handle: FakeAssetHandle): boolean {
    return this.held.has(handle);
  }
}
