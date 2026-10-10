import type { StorageKey } from '../StorageAdapter.types';

/** A `quarantine` store record: a stored value that failed validation (architecture 14 §7). */
export type QuarantineRecordDtoV1 = {
  /** Assigned by the store on `put`. */
  readonly id: number;
  readonly store: string;
  readonly key: StorageKey;
  readonly reason: string;
  /** Wall-clock milliseconds. */
  readonly quarantinedAt: number;
  readonly value: unknown;
};
