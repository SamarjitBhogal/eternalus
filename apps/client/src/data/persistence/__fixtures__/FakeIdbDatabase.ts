import type { IdbDatabaseApi, IdbTransactionApi } from '../IndexedDbStorageAdapter.types';
import type { FakeDatabaseData } from './FakeIdb.types';
import { FakeIdbTransaction } from './FakeIdbTransaction';

/** One connection to a fake database. */
export class FakeIdbDatabase implements IdbDatabaseApi {
  public onversionchange:
    ((event: { oldVersion: number; newVersion: number | null }) => void) | null = null;
  private isClosed = false;

  public constructor(private readonly data: FakeDatabaseData) {}

  public createObjectStore(
    name: string,
    options: { keyPath: string | string[]; autoIncrement: boolean },
  ): void {
    this.data.stores.set(name, { ...options, records: new Map(), nextKey: 1 });
  }

  public transaction(stores: string[], mode: 'readonly' | 'readwrite'): IdbTransactionApi {
    if (this.isClosed) {
      throw new DOMException('the connection is closed', 'InvalidStateError');
    }
    return new FakeIdbTransaction(this.data, stores, mode);
  }

  public close(): void {
    this.isClosed = true;
  }

  /** Test hook: another tab asks for a newer version. */
  public requestVersionChange(newVersion: number): void {
    this.onversionchange?.({ oldVersion: this.data.version, newVersion });
  }
}
