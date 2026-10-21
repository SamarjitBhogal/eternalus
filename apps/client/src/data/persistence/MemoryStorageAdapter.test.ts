import { describe, expect, it } from 'vitest';

import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { describeStorageAdapter } from './StorageAdapter.contract';

describeStorageAdapter('MemoryStorageAdapter', () => new MemoryStorageAdapter());

describe('MemoryStorageAdapter', () => {
  it('refuses a transaction before open', async () => {
    const adapter = new MemoryStorageAdapter();

    await expect(
      adapter.transaction(['items'], 'readonly', () => Promise.resolve()),
    ).rejects.toThrow('not open');
  });

  it('refuses a store the transaction did not ask for', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.open({
      name: 'test',
      version: 1,
      migrations: [
        {
          version: 1,
          createStores: [
            { name: 'a', keyPath: 'id' },
            { name: 'b', keyPath: 'id' },
          ],
        },
      ],
    });

    const read = adapter.transaction(['a'], 'readonly', (tx) => tx.get('b', 'x'));

    await expect(read).rejects.toThrow('not part of this transaction');
  });
});
