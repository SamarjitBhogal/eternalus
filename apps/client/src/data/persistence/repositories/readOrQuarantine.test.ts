import { describe, expect, it } from 'vitest';

import type { DtoCheck } from '../dto/DtoCheck.types';
import { MemoryStorageAdapter } from '../MemoryStorageAdapter';
import { QUARANTINE_STORE, SETTINGS_STORE, STORAGE_SCHEMA } from '../schema/migrations';
import { readOrQuarantine } from './readOrQuarantine';

const NOW = 1_760_000_000_000;

/** A validator that knows nothing about settings: any record whose `count` is a number. */
function validateCount(raw: unknown): DtoCheck<{ readonly count: number }> {
  return typeof raw === 'object' && raw !== null && 'count' in raw && typeof raw.count === 'number'
    ? { ok: true, dto: { count: raw.count } }
    : { ok: false, reason: 'count: invalid value' };
}

async function readThrough(stored: unknown) {
  const adapter = new MemoryStorageAdapter();
  await adapter.open(STORAGE_SCHEMA);
  const warnings: unknown[] = [];
  const stores = [SETTINGS_STORE, QUARANTINE_STORE];
  if (stored !== undefined) {
    await adapter.transaction(stores, 'readwrite', (tx) => tx.put(SETTINGS_STORE, stored));
  }
  const result = await adapter.transaction(stores, 'readwrite', (tx) =>
    readOrQuarantine(
      tx,
      { store: SETTINGS_STORE, key: 'p1', validate: validateCount },
      { now: () => NOW, warn: (body, attributes) => warnings.push({ body, attributes }) },
    ),
  );
  const [live, quarantined] = await adapter.transaction(stores, 'readonly', (tx) =>
    Promise.all([tx.get(SETTINGS_STORE, 'p1'), tx.get(QUARANTINE_STORE, 1)]),
  );
  return { result, live, quarantined, warnings };
}

describe('readOrQuarantine', () => {
  it('returns a valid record and null for a missing one, quarantining nothing', async () => {
    const valid = await readThrough({ profileId: 'p1', count: 3 });
    expect(valid).toMatchObject({ result: { count: 3 }, quarantined: undefined, warnings: [] });
    const missing = await readThrough(undefined);
    expect(missing).toMatchObject({ result: null, quarantined: undefined, warnings: [] });
  });

  it('moves a corrupt record to quarantine, warns once and returns null', async () => {
    const corrupt = { profileId: 'p1', count: 'three' };
    const { result, live, quarantined, warnings } = await readThrough(corrupt);
    expect(result).toBeNull();
    expect(live).toBeUndefined();
    expect(quarantined).toEqual({
      id: 1,
      store: SETTINGS_STORE,
      key: 'p1',
      reason: 'count: invalid value',
      quarantinedAt: NOW,
      value: corrupt,
    });
    expect(warnings).toEqual([
      {
        body: 'record quarantined',
        attributes: { store: SETTINGS_STORE, reason: 'count: invalid value' },
      },
    ]);
  });
});
