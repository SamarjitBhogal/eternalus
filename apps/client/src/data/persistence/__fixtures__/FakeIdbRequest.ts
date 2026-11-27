import type { IdbRequestApi } from '../IndexedDbStorageAdapter.types';

/** A request of the fake IndexedDB: the test fixture the adapter's tests run against. */
export class FakeIdbRequest<T> implements IdbRequestApi<T> {
  public result: T;
  public error: DOMException | null = null;
  public onsuccess: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  /** `placeholder` is the result until `succeed` sets the real one. */
  public constructor(placeholder: T) {
    this.result = placeholder;
  }

  /** Sets the result and calls `onsuccess`. */
  public succeed(result: T): void {
    this.result = result;
    this.onsuccess?.(new Event('success'));
  }

  /** Sets the error and calls `onerror`. */
  public fail(error: DOMException): void {
    this.error = error;
    this.onerror?.(new Event('error'));
  }
}
