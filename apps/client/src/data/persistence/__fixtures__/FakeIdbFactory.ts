import type { IdbFactoryApi } from '../IndexedDbStorageAdapter.types';
import { FAKE_EVENT_DELAY_MS } from './FakeIdb.constants';
import type { FakeDatabaseData } from './FakeIdb.types';
import { FakeIdbDatabase } from './FakeIdbDatabase';
import { FakeIdbOpenRequest } from './FakeIdbOpenRequest';

/**
 * A hand-written fake of the `indexedDB` subset the adapter uses (INBOX: the adapter's test fake).
 * Databases live in this object, so a second adapter over the same factory sees the same data.
 */
export class FakeIdbFactory implements IdbFactoryApi {
  /** Test hook: an upgrade fires `onblocked` and never completes, as with another open tab. */
  public isBlockingUpgrades = false;
  /** Every connection opened, newest last. */
  public readonly connections: FakeIdbDatabase[] = [];

  private readonly databases = new Map<string, FakeDatabaseData>();

  public open(name: string, version: number): FakeIdbOpenRequest {
    const data = this.databases.get(name) ?? {
      version: 0,
      stores: new Map(),
      tail: Promise.resolve(),
    };
    const db = new FakeIdbDatabase(data);
    const request = new FakeIdbOpenRequest(db);
    setTimeout(() => {
      if (data.version > version) {
        request.fail(new DOMException('stored version is newer', 'VersionError'));
        return;
      }
      if (data.version < version) {
        if (this.isBlockingUpgrades) {
          request.onblocked?.({ oldVersion: data.version, newVersion: version });
          return;
        }
        const oldVersion = data.version;
        data.version = version;
        this.databases.set(name, data);
        request.onupgradeneeded?.({ oldVersion, newVersion: version });
      }
      this.connections.push(db);
      request.succeed(db);
    }, FAKE_EVENT_DELAY_MS);
    return request;
  }
}
