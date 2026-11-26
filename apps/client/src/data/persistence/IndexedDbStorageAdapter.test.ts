import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';

import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import type { StorageSchema } from './StorageAdapter.types';
import { describeStorageAdapter } from './StorageAdapter.contract';
import { StorageError } from './StorageError';

const V1: StorageSchema = {
  name: 'test',
  version: 1,
  migrations: [{ version: 1, createStores: [{ name: 'items', keyPath: 'id' }] }],
};
const V2: StorageSchema = {
  ...V1,
  version: 2,
  migrations: [...V1.migrations, { version: 2, createStores: [{ name: 'extra', keyPath: 'id' }] }],
};

/**
 * Opens a raw connection (no adapter) to `V1`'s database at `version`, creating the `items` store
 * when the database is new. It sets no `onversionchange`, so it never yields to a newer version.
 */
function openRaw(factory: IDBFactory, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(V1.name, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('items')) {
        request.result.createObjectStore('items', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('raw open failed'));
    };
  });
}

describeStorageAdapter(
  'IndexedDbStorageAdapter (fake-indexeddb)',
  () => new IndexedDbStorageAdapter(new IDBFactory()),
);

describe('IndexedDbStorageAdapter over fake-indexeddb', () => {
  it('keeps the data for a second adapter over the same factory (reads and writes)', async () => {
    const factory = new IDBFactory();
    const first = new IndexedDbStorageAdapter(factory);
    await first.open(V1);
    await first.transaction(['items'], 'readwrite', (tx) => tx.put('items', { id: 'a', n: 1 }));
    first.close();

    const second = new IndexedDbStorageAdapter(factory);
    await second.open(V1);
    const read = await second.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

    expect(read).toEqual({ id: 'a', n: 1 });
  });

  it('upgrades a stored v1 database, keeping its data and adding the new store', async () => {
    const factory = new IDBFactory();
    const v1 = new IndexedDbStorageAdapter(factory);
    await v1.open(V1);
    await v1.transaction(['items'], 'readwrite', (tx) => tx.put('items', { id: 'a' }));
    v1.close();

    const v2 = new IndexedDbStorageAdapter(factory);
    await v2.open(V2);
    await v2.transaction(['extra'], 'readwrite', (tx) => tx.put('extra', { id: 'x' }));
    const kept = await v2.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

    expect(kept).toEqual({ id: 'a' });
  });

  it('rejects open with a version StorageError when the stored schema is newer', async () => {
    const factory = new IDBFactory();
    const newer = new IndexedDbStorageAdapter(factory);
    await newer.open(V2);
    newer.close();

    await expect(new IndexedDbStorageAdapter(factory).open(V1)).rejects.toMatchObject({
      name: 'StorageError',
      kind: 'version',
    });
  });

  it('rejects open with a blocked StorageError while another tab holds an old version', async () => {
    const factory = new IDBFactory();
    const holder = await openRaw(factory, 1);

    await expect(new IndexedDbStorageAdapter(factory).open(V2)).rejects.toMatchObject({
      name: 'StorageError',
      kind: 'blocked',
    });
    holder.close();
  });

  it('closes the late connection once the blocking tab lets go', async () => {
    const factory = new IDBFactory();
    const holder = await openRaw(factory, 1);
    const adapter = new IndexedDbStorageAdapter(factory);
    await expect(adapter.open(V2)).rejects.toMatchObject({ kind: 'blocked' });

    holder.close();

    // IndexedDB runs the delete after the pending open. The late connection was closed, so the
    // delete is not blocked by it.
    const deleted = await new Promise<boolean>((resolve) => {
      const request = factory.deleteDatabase(V1.name);
      request.onblocked = () => {
        resolve(false);
      };
      request.onsuccess = () => {
        resolve(true);
      };
    });
    expect(deleted).toBe(true);
  });

  it('aborts the transaction and keeps none of its writes when the work throws', async () => {
    const adapter = new IndexedDbStorageAdapter(new IDBFactory());
    await adapter.open(V1);

    const failing = adapter.transaction(['items'], 'readwrite', async (tx) => {
      await tx.put('items', { id: 'a' });
      throw new Error('crash mid-way');
    });
    await expect(failing).rejects.toThrow('crash mid-way');
    const read = await adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

    expect(read).toBeUndefined();
  });

  it('refuses a transaction before open and after close', async () => {
    const adapter = new IndexedDbStorageAdapter(new IDBFactory());
    await expect(
      adapter.transaction(['items'], 'readonly', () => Promise.resolve()),
    ).rejects.toThrow('not open');

    await adapter.open(V1);
    adapter.close();

    await expect(
      adapter.transaction(['items'], 'readonly', () => Promise.resolve()),
    ).rejects.toThrow('not open');
  });

  it('closes when another tab upgrades, and later transactions reject until open is called', async () => {
    const factory = new IDBFactory();
    const adapter = new IndexedDbStorageAdapter(factory);
    await adapter.open(V1);

    const other = await openRaw(factory, 2);
    other.close();

    await expect(
      adapter.transaction(['items'], 'readonly', () => Promise.resolve()),
    ).rejects.toThrow('not open');
    await adapter.open(V2);
    await expect(
      adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a')),
    ).resolves.toBeUndefined();
  });
});

describe('IndexedDbStorageAdapter', () => {
  it('rejects open with an unavailable StorageError where there is no indexedDB', async () => {
    const opening = IndexedDbStorageAdapter.inBrowser().open({
      name: 'test',
      version: 1,
      migrations: [],
    });

    await expect(opening).rejects.toMatchObject({ name: 'StorageError', kind: 'unavailable' });
  });
});

describe('StorageError.fromNative', () => {
  it('maps VersionError to version and any other failure to unavailable', () => {
    expect(StorageError.fromNative(new DOMException('newer', 'VersionError')).kind).toBe('version');
    expect(StorageError.fromNative(new DOMException('denied', 'InvalidStateError')).kind).toBe(
      'unavailable',
    );
  });
});
