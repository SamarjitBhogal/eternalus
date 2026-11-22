import { describe, expect, it, vi } from 'vitest';

import { FallbackStorageAdapter } from './FallbackStorageAdapter';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import type { StorageAdapter, StorageSchema } from './StorageAdapter.types';
import { StorageError } from './StorageError';

const SCHEMA: StorageSchema = {
  name: 'test',
  version: 1,
  migrations: [{ version: 1, createStores: [{ name: 'things', keyPath: 'id' }] }],
};

function failingAdapter(): StorageAdapter {
  const adapter = new MemoryStorageAdapter();
  adapter.open = () => Promise.reject(new StorageError('unavailable', 'no storage'));
  return adapter;
}

describe('FallbackStorageAdapter', () => {
  it('uses the primary when it opens, without warning', async () => {
    const warn = vi.fn();
    const adapter = new FallbackStorageAdapter(new MemoryStorageAdapter(), failingAdapter, warn);

    await adapter.open(SCHEMA);
    await adapter.transaction(['things'], 'readwrite', (tx) => tx.put('things', { id: 'a' }));

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and continues on the fallback when the primary rejects', async () => {
    const warn = vi.fn();
    const adapter = new FallbackStorageAdapter(
      failingAdapter(),
      () => new MemoryStorageAdapter(),
      warn,
    );

    await adapter.open(SCHEMA);
    await adapter.transaction(['things'], 'readwrite', (tx) => tx.put('things', { id: 'a' }));
    const read = await adapter.transaction(['things'], 'readonly', (tx) => tx.get('things', 'a'));

    expect(read).toEqual({ id: 'a' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('falling back'), {
      kind: 'unavailable',
      error: 'StorageError: no storage',
    });
  });

  it('rejects when the fallback fails too', async () => {
    const adapter = new FallbackStorageAdapter(failingAdapter(), failingAdapter, vi.fn());

    await expect(adapter.open(SCHEMA)).rejects.toMatchObject({ kind: 'unavailable' });
  });
});
