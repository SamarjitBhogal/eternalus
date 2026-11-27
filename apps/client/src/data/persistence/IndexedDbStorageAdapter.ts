import { openDatabase, requestToPromise, transactionDone } from './idbPromises';
import type {
  IdbDatabaseApi,
  IdbFactoryApi,
  IdbTransactionApi,
} from './IndexedDbStorageAdapter.types';
import type { StorageAdapter, StorageSchema, StorageTx } from './StorageAdapter.types';
import { StorageError } from './StorageError';

/**
 * The browser `StorageAdapter` (architecture 14 §4, ADR 0005): the only class that names
 * `indexedDB`. `open` runs the migration ladder inside `onupgradeneeded`; each `transaction` is one
 * IndexedDB transaction, aborted when `work` throws so none of its writes are kept. As with any
 * IndexedDB code, `work` must not await anything unrelated between its requests, or the
 * transaction commits early. On `versionchange` (another tab upgrades) the connection closes and
 * later transactions reject until `open` is called again.
 */
export class IndexedDbStorageAdapter implements StorageAdapter {
  private readonly factory: IdbFactoryApi | null;
  private db: IdbDatabaseApi | null = null;

  /** `factory` is `indexedDB`, or `null` when the browser has none (`open` then rejects). */
  public constructor(factory: IdbFactoryApi | null) {
    this.factory = factory;
  }

  /**
   * An adapter over the page's `indexedDB`, or over none when it is missing or its access throws
   * (some private modes, blocked site data); `open` then rejects with `unavailable`.
   */
  public static inBrowser(): IndexedDbStorageAdapter {
    try {
      return new IndexedDbStorageAdapter(typeof indexedDB === 'undefined' ? null : indexedDB);
    } catch {
      return new IndexedDbStorageAdapter(null);
    }
  }

  /** Opens the database, creating the stores of every migration above the stored version. */
  public async open(schema: StorageSchema): Promise<void> {
    this.close();
    if (this.factory === null) {
      throw new StorageError('unavailable', 'IndexedDB is not available');
    }
    const factory = this.factory;
    this.db = await openDatabase({
      factory,
      name: schema.name,
      version: schema.version,
      migrate: (db, oldVersion) => {
        IndexedDbStorageAdapter.migrate(db, schema, oldVersion);
      },
      onVersionChange: () => {
        this.db = null;
      },
    }).catch((error: unknown) => {
      throw error instanceof StorageError ? error : StorageError.fromNative(error);
    });
  }

  /**
   * Runs `work` in one IndexedDB transaction over `stores` and resolves once it commits. If `work`
   * throws, the transaction is aborted and the error rethrown.
   */
  public async transaction<T>(
    stores: readonly string[],
    mode: 'readonly' | 'readwrite',
    work: (tx: StorageTx) => Promise<T>,
  ): Promise<T> {
    if (this.db === null) {
      throw new Error('storage is not open');
    }
    const idbTx = this.db.transaction([...stores], mode);
    const done = transactionDone(idbTx);
    let result: T;
    try {
      result = await work(IndexedDbStorageAdapter.wrap(idbTx));
    } catch (error: unknown) {
      try {
        idbTx.abort();
      } catch {
        // Already committed or aborted: nothing left to undo.
      }
      await done.catch(() => undefined);
      throw error;
    }
    await done;
    return result;
  }

  /** Closes the connection; the data stays and `open` reopens it. */
  public close(): void {
    this.db?.close();
    this.db = null;
  }

  private static migrate(db: IdbDatabaseApi, schema: StorageSchema, oldVersion: number): void {
    for (const migration of schema.migrations) {
      if (migration.version > oldVersion && migration.version <= schema.version) {
        for (const spec of migration.createStores) {
          db.createObjectStore(spec.name, {
            keyPath: typeof spec.keyPath === 'string' ? spec.keyPath : [...spec.keyPath],
            autoIncrement: spec.autoIncrement === true,
          });
        }
      }
    }
  }

  private static wrap(idbTx: IdbTransactionApi): StorageTx {
    const request = <T>(issue: () => Promise<T>): Promise<T> => {
      try {
        return issue();
      } catch (error: unknown) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    return {
      get: (store, key) =>
        request(() => requestToPromise(idbTx.objectStore(store).get(key as IDBValidKey))),
      put: (store, value) =>
        request(() => requestToPromise(idbTx.objectStore(store).put(value))).then(() => undefined),
      delete: (store, key) =>
        request(() => requestToPromise(idbTx.objectStore(store).delete(key as IDBValidKey))),
    };
  }
}
