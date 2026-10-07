import type {
  StorageAdapter,
  StorageKey,
  StorageSchema,
  StorageTx,
  StoreSpec,
} from './StorageAdapter.types';

/**
 * An in-memory `StorageAdapter` for tests, the `?memory` flag and the fallback when IndexedDB is
 * unavailable. Behaves like IndexedDB where the contract says so: values are structured-cloned
 * in and out, a failed transaction keeps none of its writes, and data survives `close`/`open`.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private readonly specs = new Map<string, StoreSpec>();
  private data = new Map<string, Map<string, unknown>>();
  private readonly nextIds = new Map<string, number>();
  private version = 0;
  private isOpen = false;

  /** Runs the migrations above the stored version; refuses a schema older than the data. */
  public open(schema: StorageSchema): Promise<void> {
    if (schema.version < this.version) {
      return Promise.reject(
        new Error(
          `stored schema v${String(this.version)} is newer than v${String(schema.version)}`,
        ),
      );
    }
    for (const migration of schema.migrations) {
      if (migration.version > this.version && migration.version <= schema.version) {
        migration.createStores.forEach((spec) => {
          this.specs.set(spec.name, spec);
          this.data.set(spec.name, new Map());
        });
      }
    }
    this.version = schema.version;
    this.isOpen = true;
    return Promise.resolve();
  }

  /** Runs `work` on copies of `stores` and commits them only if it resolves. */
  public async transaction<T>(
    stores: readonly string[],
    mode: 'readonly' | 'readwrite',
    work: (tx: StorageTx) => Promise<T>,
  ): Promise<T> {
    if (!this.isOpen) {
      throw new Error('storage is not open');
    }
    const draft = new Map(stores.map((name) => [name, new Map(this.storeData(name))]));
    const scoped = (store: string): Map<string, unknown> => {
      const records = draft.get(store);
      if (records === undefined) {
        throw new Error(`store "${store}" is not part of this transaction`);
      }
      return records;
    };
    const writable = (store: string): Map<string, unknown> => {
      if (mode === 'readonly') {
        throw new Error(`cannot write to "${store}" in a readonly transaction`);
      }
      return scoped(store);
    };
    const result = await work({
      get: (store, key) =>
        Promise.resolve(structuredClone(scoped(store).get(MemoryStorageAdapter.keyId(key)))),
      put: (store, value) =>
        MemoryStorageAdapter.attempt(() => {
          const records = writable(store);
          const record = structuredClone(value);
          records.set(MemoryStorageAdapter.keyId(this.keyOf(store, record)), record);
        }),
      delete: (store, key) =>
        MemoryStorageAdapter.attempt(() => writable(store).delete(MemoryStorageAdapter.keyId(key))),
    });
    if (mode === 'readwrite') {
      draft.forEach((records, name) => this.data.set(name, records));
    }
    return result;
  }

  /** Closes the adapter; the data stays for the next `open`. */
  public close(): void {
    this.isOpen = false;
  }

  private storeData(name: string): Map<string, unknown> {
    const records = this.data.get(name);
    if (records === undefined) {
      throw new Error(`unknown store "${name}"`);
    }
    return records;
  }

  /** The key of `record` from its store's key path, assigning one in an auto-increment store. */
  private keyOf(store: string, record: unknown): StorageKey {
    const spec = this.specs.get(store);
    if (spec === undefined || typeof record !== 'object' || record === null) {
      throw new Error(`cannot key a record for "${store}"`);
    }
    const fields = record as Record<string, unknown>;
    if (typeof spec.keyPath === 'string' && spec.autoIncrement === true) {
      fields[spec.keyPath] ??= this.nextId(store);
    }
    const paths = typeof spec.keyPath === 'string' ? [spec.keyPath] : spec.keyPath;
    const parts = paths.map((path) => fields[path]);
    if (!parts.every((part) => typeof part === 'string' || typeof part === 'number')) {
      throw new Error(`record for "${store}" has no valid key at ${paths.join(', ')}`);
    }
    return typeof spec.keyPath === 'string' ? (parts[0] ?? '') : parts;
  }

  private nextId(store: string): number {
    const id = (this.nextIds.get(store) ?? 0) + 1;
    this.nextIds.set(store, id);
    return id;
  }

  private static keyId(key: StorageKey): string {
    return JSON.stringify(key);
  }

  /** Turns a synchronous throw into a rejection, as an IndexedDB request would report it. */
  private static attempt(write: () => unknown): Promise<void> {
    try {
      write();
      return Promise.resolve();
    } catch (error: unknown) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
