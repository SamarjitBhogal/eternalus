import { describe, expect, it } from 'vitest';

import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import { StorageError } from './StorageError';

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
