import type { QuarantineRecordDtoV1 } from '../dto/QuarantineRecordDto.types';
import { QUARANTINE_STORE } from '../schema/migrations';
import type { StorageTx } from '../StorageAdapter.types';
import type { QuarantineReport, RecordRead } from './readOrQuarantine.types';

/**
 * Reads the record under `key` in `store` and validates it; every repository reads through this
 * (architecture 14 §8). A corrupt record is copied to the quarantine store, removed from `store`
 * and reported through `warn`, all in `tx`, so the caller falls back to its default and no screen
 * can crash on stored data. `tx` must be read-write over `store` and the quarantine store.
 * @returns The validated record, or `null` when there is none or it was quarantined.
 */
export async function readOrQuarantine<T>(
  tx: StorageTx,
  { store, key, validate }: RecordRead<T>,
  report: QuarantineReport,
): Promise<T | null> {
  const raw = await tx.get(store, key);
  if (raw === undefined) {
    return null;
  }
  const checked = validate(raw);
  if (checked.ok) {
    return checked.dto;
  }
  const record: Omit<QuarantineRecordDtoV1, 'id'> = {
    store,
    key,
    reason: checked.reason,
    quarantinedAt: report.now(),
    value: raw,
  };
  await tx.put(QUARANTINE_STORE, record);
  await tx.delete(store, key);
  report.warn('record quarantined', { store, reason: checked.reason });
  return null;
}
