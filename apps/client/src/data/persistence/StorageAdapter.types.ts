/** A record key: a string or number, or an array of them for a compound key path. */
export type StorageKey = string | number | readonly (string | number)[];

/** One object store: its name and where each record's key is found. */
export type StoreSpec = {
  readonly name: string;
  /** The record field (or fields, for a compound key) that holds the key. */
  readonly keyPath: string | readonly string[];
  /** When true, `put` assigns increasing numeric keys to records that have none. */
  readonly autoIncrement?: boolean;
};

/** One schema step: what upgrading from `version - 1` to `version` creates. */
type Migration = { readonly version: number; readonly createStores: readonly StoreSpec[] };

/** The database to open: its name, target version and the migration ladder to reach it. */
export type StorageSchema = {
  readonly name: string;
  readonly version: number;
  readonly migrations: readonly Migration[];
};

/**
 * The reads and writes inside one transaction. Reads return `unknown`: stored data is never
 * trusted, so callers validate it (architecture 14 §8).
 */
export interface StorageTx {
  /** The record stored under `key`, or `undefined`. */
  get(store: string, key: StorageKey): Promise<unknown>;
  /** Stores a structured-cloneable `value` under the key its store's key path names. */
  put(store: string, value: unknown): Promise<void>;
  /** Removes the record stored under `key`, if any. */
  delete(store: string, key: StorageKey): Promise<void>;
}

/**
 * The storage port (architecture 09 §7, 14 §4). Repositories and `PersistenceController` see
 * only this interface; `MemoryStorageAdapter` implements it now, `IndexedDbStorageAdapter` in S2.
 */
export interface StorageAdapter {
  /** Opens the database, running every migration above the stored version. */
  open(schema: StorageSchema): Promise<void>;
  /**
   * Runs `work` as one unit of work over `stores`: if it throws, none of its writes are kept.
   * @returns What `work` returned.
   */
  transaction<T>(
    stores: readonly string[],
    mode: 'readonly' | 'readwrite',
    work: (tx: StorageTx) => Promise<T>,
  ): Promise<T>;
  /** Closes the connection; the data stays and `open` reopens it. */
  close(): void;
}
