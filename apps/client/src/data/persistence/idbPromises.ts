import type {
  IdbDatabaseApi,
  IdbFactoryApi,
  IdbRequestApi,
  IdbTransactionApi,
} from './IndexedDbStorageAdapter.types';
import { StorageError } from './StorageError';

/** Resolves with a request's result, or rejects with its error. */
export function requestToPromise<T>(request: IdbRequestApi<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'));
    };
  });
}

/** Resolves when a transaction commits; rejects when it fails or is aborted. */
export function transactionDone(tx: IdbTransactionApi): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    };
  });
}

/** What `openDatabase` needs. */
type OpenOptions = {
  readonly factory: IdbFactoryApi;
  readonly name: string;
  readonly version: number;
  /** Runs inside `onupgradeneeded`, the only place stores may change (architecture 14 §5). */
  readonly migrate: (db: IdbDatabaseApi, oldVersion: number) => void;
  /** Called after the connection closed because another tab wants a newer version. */
  readonly onVersionChange: () => void;
};

/**
 * Opens a database, running `migrate` on upgrade. Rejects with a `StorageError`: `version` when
 * the stored schema is newer, `blocked` when another tab holds an old connection, `unavailable`
 * otherwise (architecture 14 §4, §10). A connection that succeeds after `blocked` is closed.
 */
export function openDatabase(options: OpenOptions): Promise<IdbDatabaseApi> {
  return new Promise((resolve, reject) => {
    const request = options.factory.open(options.name, options.version);
    let isBlocked = false;
    request.onupgradeneeded = (event) => {
      options.migrate(request.result, event.oldVersion);
    };
    request.onblocked = () => {
      isBlocked = true;
      reject(new StorageError('blocked', 'upgrade blocked by another tab'));
    };
    request.onsuccess = () => {
      const db = request.result;
      if (isBlocked) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        options.onVersionChange();
      };
      resolve(db);
    };
    request.onerror = () => {
      reject(StorageError.fromNative(request.error));
    };
  });
}
