import type { StorageFallback } from './FallbackStorageAdapter.types';
import type { WarnReporter } from './repositories/readOrQuarantine.types';
import type { StorageAdapter } from './StorageAdapter.types';

/** What `main.tsx` injects into `PersistenceController`. */
export type PersistenceControllerDeps = {
  /**
   * `MemoryStorageAdapter` in the browser and in tests until the settings and loadout layout is
   * final; then `IndexedDbStorageAdapter` in the browser (DEC-354 (5)).
   */
  readonly adapter: StorageAdapter;
  /**
   * Used only when `adapter` fails to open (IndexedDB missing, private mode, a newer or blocked
   * schema): it reports the failure at ERROR and builds a `MemoryStorageAdapter`, so the session
   * runs but nothing survives it (architecture 14 §10). Without it, a failed open rejects.
   */
  readonly fallback?: StorageFallback;
  /** Every `InputAction` id, from `game/input/keybindings.ts`, to validate stored bindings. */
  readonly knownActions: ReadonlySet<string>;
  /** Wall-clock milliseconds, for dating quarantined records. */
  readonly now: () => number;
  /** Reports a quarantined record at WARN. */
  readonly warn: WarnReporter;
};
