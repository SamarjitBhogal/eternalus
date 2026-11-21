import type { WarnReporter } from './repositories/readOrQuarantine.types';
import type { StorageAdapter } from './StorageAdapter.types';

/** What `main.tsx` injects into `PersistenceController`. */
export type PersistenceControllerDeps = {
  /** `IndexedDbStorageAdapter` in the browser, `MemoryStorageAdapter` in tests. */
  readonly adapter: StorageAdapter;
  /**
   * Built only when `adapter` fails to open (IndexedDB missing, private mode, a newer or blocked
   * schema): `MemoryStorageAdapter`, so the session runs but nothing survives it (architecture
   * 14 §10). Without it, a failed open rejects.
   */
  readonly fallback?: () => StorageAdapter;
  /** Every `InputAction` id, from `game/input/keybindings.ts`, to validate stored bindings. */
  readonly knownActions: ReadonlySet<string>;
  /** Wall-clock milliseconds, for dating quarantined records. */
  readonly now: () => number;
  /** Reports a quarantined record, or the fallback to memory storage, at WARN. */
  readonly warn: WarnReporter;
};
