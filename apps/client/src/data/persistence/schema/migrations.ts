import type { StorageSchema } from '../StorageAdapter.types';

/** Per-profile settings and keybindings, one record per profile and group (architecture 14 §7). */
export const SETTINGS_STORE = 'settings';

/** Saved loadouts, one record per profile and Legend (architecture 14 §7, DEC-354 (1)). */
export const LOADOUT_STORE = 'loadouts';

/** The guest id the Duel server issued, one record per profile (ADR 0016 point 5). */
export const GUEST_STORE = 'guest';

/** Records that failed validation on read, kept for bug reports (architecture 14 §8). */
export const QUARANTINE_STORE = 'quarantine';

/**
 * The database schema: the only place stores are created (architecture 14 §5). With
 * `IndexedDbStorageAdapter` wired, v1 is on disk: whether it may still change before release
 * waits for the owner (`INBOX.md`); after that, a store change is a new migration version.
 */
export const STORAGE_SCHEMA: StorageSchema = {
  name: 'eternalus',
  version: 1,
  migrations: [
    {
      version: 1,
      createStores: [
        { name: SETTINGS_STORE, keyPath: ['profileId', 'group'] },
        { name: LOADOUT_STORE, keyPath: 'id' },
        { name: GUEST_STORE, keyPath: 'profileId' },
        { name: QUARANTINE_STORE, keyPath: 'id', autoIncrement: true },
      ],
    },
  ],
};
