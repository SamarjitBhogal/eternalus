import type { WarnReporter } from './repositories/readOrQuarantine.types';
import type { StorageAdapter } from './StorageAdapter.types';

/** What `main.tsx` injects into `PersistenceController`. */
export type PersistenceControllerDeps = {
  /** `MemoryStorageAdapter` until `IndexedDbStorageAdapter` lands (S2). */
  readonly adapter: StorageAdapter;
  /** Every `InputAction` id, from `game/input/keybindings.ts`, to validate stored bindings. */
  readonly knownActions: ReadonlySet<string>;
  /** Wall-clock milliseconds, for dating quarantined records. */
  readonly now: () => number;
  /** Reports a quarantined record at WARN. */
  readonly warn: WarnReporter;
};
