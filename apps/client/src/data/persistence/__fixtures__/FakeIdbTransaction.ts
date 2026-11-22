import type { IdbTransactionApi } from '../IndexedDbStorageAdapter.types';
import type { FakeDatabaseData, FakeStoreData } from './FakeIdb.types';
import { FAKE_EVENT_DELAY_MS } from './FakeIdb.constants';
import { FakeIdbRequest } from './FakeIdbRequest';

/**
 * A transaction of the fake IndexedDB. Requests apply when delivered, one transaction at a time;
 * it commits once none is left pending and aborting restores the records it started with.
 */
export class FakeIdbTransaction implements IdbTransactionApi {
  public readonly error: DOMException | null = null;
  public oncomplete: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onabort: ((event: Event) => void) | null = null;

  private readonly restore: (() => void)[] = [];
  private readonly started: Promise<void>;
  private release: () => void = () => undefined;
  private pending = 0;
  private isFinished = false;

  public constructor(
    private readonly data: FakeDatabaseData,
    private readonly names: readonly string[],
    private readonly mode: 'readonly' | 'readwrite',
  ) {
    const previous = data.tail;
    this.started = previous;
    data.tail = new Promise<void>((resolve) => {
      this.release = resolve;
    });
    void this.started.then(() => {
      for (const store of data.stores.values()) {
        const { records, nextKey } = { records: new Map(store.records), nextKey: store.nextKey };
        this.restore.push(() => {
          store.records.clear();
          records.forEach((value, key) => store.records.set(key, value));
          store.nextKey = nextKey;
        });
      }
    });
    this.scheduleCommit();
  }

  public objectStore(name: string): ReturnType<IdbTransactionApi['objectStore']> {
    const store = this.data.stores.get(name);
    if (store === undefined || !this.names.includes(name) || this.isFinished) {
      throw new DOMException(`no store ${name} in this transaction`, 'NotFoundError');
    }
    return {
      get: (key) =>
        this.issue<unknown>(undefined, () =>
          structuredClone(store.records.get(JSON.stringify(key))),
        ),
      put: (value) => this.write(store, value),
      delete: (key) =>
        this.issue<undefined>(undefined, () => {
          store.records.delete(JSON.stringify(key));
          return undefined;
        }),
    };
  }

  public abort(): void {
    if (this.isFinished) {
      throw new DOMException('transaction finished', 'InvalidStateError');
    }
    this.isFinished = true;
    this.restore.forEach((restore) => {
      restore();
    });
    setTimeout(() => {
      this.onabort?.(new Event('abort'));
      this.release();
    }, FAKE_EVENT_DELAY_MS);
  }

  private write(store: FakeStoreData, value: unknown): FakeIdbRequest<unknown> {
    if (this.mode === 'readonly') {
      throw new DOMException('readonly transaction', 'ReadOnlyError');
    }
    const copy: unknown = structuredClone(value);
    return this.issue<unknown>(undefined, () => {
      const record = FakeIdbTransaction.withKey(store, copy);
      const key = JSON.stringify(FakeIdbTransaction.keyOf(store, record));
      store.records.set(key, record);
      return key;
    });
  }

  private issue<T>(placeholder: T, apply: () => T): FakeIdbRequest<T> {
    const request = new FakeIdbRequest<T>(placeholder);
    this.pending += 1;
    void this.started.then(() =>
      setTimeout(() => {
        if (this.isFinished) return;
        this.pending -= 1;
        request.succeed(apply());
        this.scheduleCommit();
      }, FAKE_EVENT_DELAY_MS),
    );
    return request;
  }

  private scheduleCommit(): void {
    void this.started.then(() =>
      setTimeout(() => {
        if (this.isFinished || this.pending > 0) return;
        this.isFinished = true;
        this.oncomplete?.(new Event('complete'));
        this.release();
      }, FAKE_EVENT_DELAY_MS),
    );
  }

  private static withKey(store: FakeStoreData, value: unknown): unknown {
    if (typeof store.keyPath !== 'string' || !store.autoIncrement) return value;
    if (typeof value === 'object' && value !== null && store.keyPath in value) return value;
    const record: unknown = Object.assign({}, value, { [store.keyPath]: store.nextKey });
    store.nextKey += 1;
    return record;
  }

  private static keyOf(store: FakeStoreData, record: unknown): unknown {
    const read = (path: string): unknown =>
      typeof record === 'object' && record !== null
        ? Object.getOwnPropertyDescriptor(record, path)?.value
        : undefined;
    return typeof store.keyPath === 'string' ? read(store.keyPath) : store.keyPath.map(read);
  }
}
