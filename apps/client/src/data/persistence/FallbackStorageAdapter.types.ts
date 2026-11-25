import type { LogAttributes } from '@eternalus/core';

import type { StorageAdapter } from './StorageAdapter.types';

/** What happens when the primary adapter does not open (architecture 14 §10). */
export type StorageFallback = {
  /** Builds the adapter the session goes on with: `MemoryStorageAdapter`, so nothing survives it. */
  readonly build: () => StorageAdapter;
  /**
   * Reports the switch at ERROR (14 §10): an ERROR record becomes an error report, so a
   * player's lost progress does not stay hidden. The caller routes it to the `Logger` port.
   */
  readonly reportError: (body: string, attributes: LogAttributes) => void;
};
