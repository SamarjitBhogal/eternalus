import { describe, expect, it } from 'vitest';

import type { StorageAdapter, StorageSchema } from './StorageAdapter.types';

const V1: StorageSchema = {
  name: 'contract-test',
  version: 1,
  migrations: [
    {
      version: 1,
      createStores: [
        { name: 'items', keyPath: 'id' },
        { name: 'pairs', keyPath: ['owner', 'slot'] },
        { name: 'log', keyPath: 'id', autoIncrement: true },
      ],
    },
  ],
};

const V2: StorageSchema = {
  ...V1,
  version: 2,
  migrations: [...V1.migrations, { version: 2, createStores: [{ name: 'extra', keyPath: 'id' }] }],
};

/**
 * The behaviour every `StorageAdapter` must share (architecture 09 §9, 14 §12). Each adapter's
 * test calls it with a factory for a fresh, empty adapter.
 */
export function describeStorageAdapter(name: string, make: () => StorageAdapter): void {
  describe(`${name} StorageAdapter contract`, () => {
    async function opened(schema: StorageSchema = V1): Promise<StorageAdapter> {
      const adapter = make();
      await adapter.open(schema);
      return adapter;
    }

    it('round-trips a structured-cloneable record by its key', async () => {
      const adapter = await opened();
      const record = { id: 'a', nested: { list: [1, 2, 3], flag: true, none: null } };

      await adapter.transaction(['items'], 'readwrite', (tx) => tx.put('items', record));
      const read = await adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

      expect(read).toEqual(record);
    });

    it('keys a record by a compound key path', async () => {
      const adapter = await opened();

      await adapter.transaction(['pairs'], 'readwrite', (tx) =>
        tx.put('pairs', { owner: 'p1', slot: 'audio', value: 7 }),
      );
      const read = await adapter.transaction(['pairs'], 'readonly', (tx) =>
        tx.get('pairs', ['p1', 'audio']),
      );

      expect(read).toEqual({ owner: 'p1', slot: 'audio', value: 7 });
    });

    it('returns undefined for a missing key and forgets a deleted one', async () => {
      const adapter = await opened();
      await adapter.transaction(['items'], 'readwrite', (tx) => tx.put('items', { id: 'a' }));

      await adapter.transaction(['items'], 'readwrite', (tx) => tx.delete('items', 'a'));
      const read = await adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

      expect(read).toBeUndefined();
    });

    it('stores a copy, so later changes to the written object are not saved', async () => {
      const adapter = await opened();
      const record = { id: 'a', value: 1 };

      await adapter.transaction(['items'], 'readwrite', (tx) => tx.put('items', record));
      record.value = 2;
      const read = await adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

      expect(read).toEqual({ id: 'a', value: 1 });
    });

    it('keeps none of the writes of a unit of work that fails', async () => {
      const adapter = await opened();

      const failing = adapter.transaction(['items'], 'readwrite', async (tx) => {
        await tx.put('items', { id: 'a' });
        throw new Error('crash mid-way');
      });
      await expect(failing).rejects.toThrow('crash mid-way');
      const read = await adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));

      expect(read).toBeUndefined();
    });

    it('refuses writes in a readonly transaction', async () => {
      const adapter = await opened();

      const write = adapter.transaction(['items'], 'readonly', (tx) =>
        tx.put('items', { id: 'a' }),
      );

      await expect(write).rejects.toThrow();
    });

    it('refuses a value that cannot be structured-cloned', async () => {
      const adapter = await opened();

      const write = adapter.transaction(['items'], 'readwrite', (tx) =>
        tx.put('items', { id: 'a', callback: () => undefined }),
      );

      await expect(write).rejects.toThrow();
    });

    it('assigns increasing keys in an auto-increment store', async () => {
      const adapter = await opened();

      await adapter.transaction(['log'], 'readwrite', async (tx) => {
        await tx.put('log', { line: 'first' });
        await tx.put('log', { line: 'second' });
      });
      const [first, second] = await adapter.transaction(['log'], 'readonly', (tx) =>
        Promise.all([tx.get('log', 1), tx.get('log', 2)]),
      );

      expect(first).toEqual({ id: 1, line: 'first' });
      expect(second).toEqual({ id: 2, line: 'second' });
    });

    it('keeps the data across close and open, and migrates to a newer schema', async () => {
      const adapter = await opened();
      await adapter.transaction(['items'], 'readwrite', (tx) => tx.put('items', { id: 'a' }));

      adapter.close();
      await adapter.open(V2);
      const kept = await adapter.transaction(['items'], 'readonly', (tx) => tx.get('items', 'a'));
      await adapter.transaction(['extra'], 'readwrite', (tx) => tx.put('extra', { id: 'x' }));

      expect(kept).toEqual({ id: 'a' });
    });

    it('refuses to open data written by a newer schema', async () => {
      const adapter = await opened(V2);
      adapter.close();

      await expect(adapter.open(V1)).rejects.toThrow();
    });
  });
}
