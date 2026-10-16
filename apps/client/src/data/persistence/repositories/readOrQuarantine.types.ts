import type { LogAttributes } from '@eternalus/core';

import type { DtoCheck } from '../dto/DtoCheck.types';
import type { StorageKey } from '../StorageAdapter.types';

/**
 * Reports a WARN-level event (a quarantined record). `main.tsx` routes it to the `Logger` port;
 * `data/` imports core types only, so it does not build log records itself.
 */
export type WarnReporter = (body: string, attributes: LogAttributes) => void;

/** The record to read: where it is and how to check it. */
export type RecordRead<T> = {
  readonly store: string;
  readonly key: StorageKey;
  readonly validate: (raw: unknown) => DtoCheck<T>;
};

/** What a repository gives every quarantine: the wall clock and the WARN reporter. */
export type QuarantineReport = { readonly now: () => number; readonly warn: WarnReporter };
