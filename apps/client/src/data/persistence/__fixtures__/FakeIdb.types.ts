/** One object store of a fake database. */
export type FakeStoreData = {
  readonly keyPath: string | readonly string[];
  readonly autoIncrement: boolean;
  readonly records: Map<string, unknown>;
  nextKey: number;
};

/** One fake database: what survives closing every connection to it. */
export type FakeDatabaseData = {
  version: number;
  readonly stores: Map<string, FakeStoreData>;
  /** Settles when the newest transaction ends: the next one starts after it (as IndexedDB does). */
  tail: Promise<void>;
};
