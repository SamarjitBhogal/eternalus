import { FALLBACK_ERROR, UNKNOWN_ERROR_KIND } from './FallbackStorageAdapter.constants';
import type { StorageFallback } from './FallbackStorageAdapter.types';
import type { StorageAdapter, StorageSchema, StorageTx } from './StorageAdapter.types';
import { StorageError } from './StorageError';

/**
 * A `StorageAdapter` that opens `primary` and, if that fails, reports it at ERROR and continues on
 * the adapter `fallback` builds (architecture 14 §10): nothing is saved past the session. Every
 * later call goes to whichever adapter opened.
 */
export class FallbackStorageAdapter implements StorageAdapter {
  private readonly primary: StorageAdapter;
  private readonly fallback: StorageFallback;
  private active: StorageAdapter;

  /** `fallback.build` is called at most once, from `open`. */
  public constructor(primary: StorageAdapter, fallback: StorageFallback) {
    this.primary = primary;
    this.fallback = fallback;
    this.active = primary;
  }

  /** Opens the primary adapter, or the fallback when the primary rejects. */
  public async open(schema: StorageSchema): Promise<void> {
    this.active = this.primary;
    try {
      await this.primary.open(schema);
    } catch (error: unknown) {
      this.fallback.reportError(FALLBACK_ERROR, {
        kind: error instanceof StorageError ? error.kind : UNKNOWN_ERROR_KIND,
        error: String(error),
      });
      this.active = this.fallback.build();
      await this.active.open(schema);
    }
  }

  /** Runs `work` on the adapter that opened. */
  public transaction<T>(
    stores: readonly string[],
    mode: 'readonly' | 'readwrite',
    work: (tx: StorageTx) => Promise<T>,
  ): Promise<T> {
    return this.active.transaction(stores, mode, work);
  }

  /** Closes the adapter that opened. */
  public close(): void {
    this.active.close();
  }
}
