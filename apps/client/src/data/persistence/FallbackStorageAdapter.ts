import type { WarnReporter } from './repositories/readOrQuarantine.types';
import type { StorageAdapter, StorageSchema, StorageTx } from './StorageAdapter.types';
import { StorageError } from './StorageError';

/**
 * A `StorageAdapter` that opens `primary` and, if that fails, warns and continues on the adapter
 * `fallback` builds (architecture 14 §10): nothing is saved past the session. Every later call goes
 * to whichever adapter opened.
 */
export class FallbackStorageAdapter implements StorageAdapter {
  private readonly primary: StorageAdapter;
  private readonly fallback: () => StorageAdapter;
  private readonly warn: WarnReporter;
  private active: StorageAdapter;

  /** `warn` reports the switch; `fallback` is called at most once, from `open`. */
  public constructor(primary: StorageAdapter, fallback: () => StorageAdapter, warn: WarnReporter) {
    this.primary = primary;
    this.fallback = fallback;
    this.warn = warn;
    this.active = primary;
  }

  /** Opens the primary adapter, or the fallback when the primary rejects. */
  public async open(schema: StorageSchema): Promise<void> {
    this.active = this.primary;
    try {
      await this.primary.open(schema);
    } catch (error: unknown) {
      this.warn('storage unavailable, falling back to memory: progress will not be saved', {
        kind: error instanceof StorageError ? error.kind : 'unknown',
        error: String(error),
      });
      this.active = this.fallback();
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
