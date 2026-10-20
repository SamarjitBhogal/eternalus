import type { StorageSchema } from '../StorageAdapter.types';

/** Per-profile settings and keybindings, one record per profile. */
export const SETTINGS_STORE = 'settings';

/** Records that failed validation on read, kept for bug reports (architecture 14 §8). */
export const QUARANTINE_STORE = 'quarantine';

/**
 * The database schema: the only place stores are created (architecture 14 §5). Nothing is on
 * disk before IndexedDB lands in S2, so v1 still grows with each record type until then.
 */
export const STORAGE_SCHEMA: StorageSchema = {
  name: 'eternalus',
  version: 1,
  migrations: [
    {
      version: 1,
      createStores: [
        { name: SETTINGS_STORE, keyPath: 'profileId' },
        { name: QUARANTINE_STORE, keyPath: 'id', autoIncrement: true },
      ],
    },
  ],
};
