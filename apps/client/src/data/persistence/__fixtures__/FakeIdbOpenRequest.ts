import type { IdbDatabaseApi } from '../IndexedDbStorageAdapter.types';
import { FakeIdbRequest } from './FakeIdbRequest';

/** The fields of a version-change event the adapter reads. */
type VersionChange = { readonly oldVersion: number; readonly newVersion: number | null };

/** An `open` request of the fake IndexedDB, with the two extra events of `IDBOpenDBRequest`. */
export class FakeIdbOpenRequest extends FakeIdbRequest<IdbDatabaseApi> {
  public onupgradeneeded: ((event: VersionChange) => void) | null = null;
  public onblocked: ((event: VersionChange) => void) | null = null;
}
