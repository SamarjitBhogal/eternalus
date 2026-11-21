/**
 * A handler whose parameter is checked bivariantly, so the browser's own `IDB*` objects (whose
 * handlers take the full `IDBVersionChangeEvent`) satisfy these narrow interfaces.
 */
type BivariantHandler<E> = { handle(event: E): void }['handle'];

/** The fields of a version-change event the adapter reads. */
export type IdbVersionChange = { readonly oldVersion: number; readonly newVersion: number | null };

/** The part of `IDBRequest` the adapter uses. */
export interface IdbRequestApi<T> {
  readonly result: T;
  readonly error: DOMException | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
}

/** The part of `IDBOpenDBRequest` the adapter uses. */
export interface IdbOpenRequestApi extends IdbRequestApi<IdbDatabaseApi> {
  onupgradeneeded: BivariantHandler<IdbVersionChange> | null;
  onblocked: BivariantHandler<IdbVersionChange> | null;
}

/** The part of `IDBObjectStore` the adapter uses. */
export interface IdbObjectStoreApi {
  get(key: IDBValidKey): IdbRequestApi<unknown>;
  put(value: unknown): IdbRequestApi<unknown>;
  delete(key: IDBValidKey): IdbRequestApi<undefined>;
}

/** The part of `IDBTransaction` the adapter uses. */
export interface IdbTransactionApi {
  readonly error: DOMException | null;
  oncomplete: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onabort: ((event: Event) => void) | null;
  objectStore(name: string): IdbObjectStoreApi;
  abort(): void;
}

/** The part of `IDBDatabase` the adapter uses. */
export interface IdbDatabaseApi {
  onversionchange: BivariantHandler<IdbVersionChange> | null;
  createObjectStore(
    name: string,
    options: { keyPath: string | string[]; autoIncrement: boolean },
  ): unknown;
  transaction(stores: string[], mode: 'readonly' | 'readwrite'): IdbTransactionApi;
  close(): void;
}

/** The part of `IDBFactory` (`indexedDB`) the adapter uses. */
export interface IdbFactoryApi {
  open(name: string, version: number): IdbOpenRequestApi;
}
