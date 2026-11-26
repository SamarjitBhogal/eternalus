import { describe, expect, it } from 'vitest';

import { loadoutKey } from '../dto/LoadoutDto';
import { MemoryStorageAdapter } from '../MemoryStorageAdapter';
import { LOADOUT_STORE, QUARANTINE_STORE, STORAGE_SCHEMA } from '../schema/migrations';
import { LoadoutRepository } from './LoadoutRepository';

const NOW = 1_760_000_000_000;
const PROFILE = 'local';

async function setup(): Promise<{
  adapter: MemoryStorageAdapter;
  repository: LoadoutRepository;
  warnings: string[];
}> {
  const adapter = new MemoryStorageAdapter();
  await adapter.open(STORAGE_SCHEMA);
  const warnings: string[] = [];
  const repository = new LoadoutRepository(
    adapter,
    () => NOW,
    (body, attributes) => {
      warnings.push(`${body}: ${String(attributes.reason)}`);
    },
  );
  return { adapter, repository, warnings };
}

function storeRaw(adapter: MemoryStorageAdapter, value: unknown): Promise<void> {
  return adapter.transaction([LOADOUT_STORE], 'readwrite', (tx) => tx.put(LOADOUT_STORE, value));
}

function readRaw(
  adapter: MemoryStorageAdapter,
  store: string,
  key: string | number,
): Promise<unknown> {
  return adapter.transaction([store], 'readonly', (tx) => tx.get(store, key));
}

describe('LoadoutRepository', () => {
  it('loads what it saved', async () => {
    const { repository } = await setup();
    await repository.save(PROFILE, 'knight', { primaryWeaponId: 'raptor-talons' });
    expect(await repository.load(PROFILE, 'knight')).toEqual({
      primaryWeaponId: 'raptor-talons',
    });
  });

  it('answers null when nothing is saved for the Legend', async () => {
    const { repository } = await setup();
    expect(await repository.load(PROFILE, 'knight')).toBeNull();
  });

  it('keeps one loadout per profile and Legend, and a second save replaces the first', async () => {
    const { repository } = await setup();
    await repository.save(PROFILE, 'knight', { primaryWeaponId: 'raptor-talons' });
    await repository.save(PROFILE, 'oracle', { primaryWeaponId: 'magus-staff' });
    await repository.save(PROFILE, 'knight', { primaryWeaponId: 'magus-staff' });
    expect(await repository.load(PROFILE, 'knight')).toEqual({ primaryWeaponId: 'magus-staff' });
    expect(await repository.load(PROFILE, 'oracle')).toEqual({ primaryWeaponId: 'magus-staff' });
    expect(await repository.load('other', 'knight')).toBeNull();
  });

  it('saving for the Paladin leaves the Knight of the same class unchanged (DEC-354 (1))', async () => {
    const { adapter, repository } = await setup();
    await repository.save(PROFILE, 'knight', { primaryWeaponId: 'raptor-talons' });
    await repository.save(PROFILE, 'paladin', { primaryWeaponId: 'wuuthrad' });
    expect(await repository.load(PROFILE, 'knight')).toEqual({ primaryWeaponId: 'raptor-talons' });
    expect(await repository.load(PROFILE, 'paladin')).toEqual({ primaryWeaponId: 'wuuthrad' });
    expect(await readRaw(adapter, LOADOUT_STORE, loadoutKey(PROFILE, 'paladin'))).toEqual({
      schemaVersion: 1,
      id: 'local/paladin',
      profileId: PROFILE,
      specId: 'paladin',
      primaryWeaponId: 'wuuthrad',
    });
  });

  it('loads every named Legend that has a saved loadout and leaves the others out', async () => {
    const { repository } = await setup();
    await repository.save(PROFILE, 'knight', { primaryWeaponId: 'raptor-talons' });
    const all = await repository.loadAll(PROFILE, ['knight', 'paladin', 'oracle']);
    expect([...all.keys()]).toEqual(['knight']);
    expect(all.get('knight')).toEqual({ primaryWeaponId: 'raptor-talons' });
  });

  it('quarantines a corrupt record, reports it and answers null', async () => {
    const { adapter, repository, warnings } = await setup();
    const id = loadoutKey(PROFILE, 'knight');
    await storeRaw(adapter, { id, profileId: PROFILE, specId: 'knight', schemaVersion: 1 });
    expect(await repository.load(PROFILE, 'knight')).toBeNull();
    expect(warnings).toEqual(['record quarantined: primaryWeaponId: not a string']);
    expect(await readRaw(adapter, LOADOUT_STORE, id)).toBeUndefined();
    expect(await readRaw(adapter, QUARANTINE_STORE, 1)).toMatchObject({
      store: LOADOUT_STORE,
      key: id,
      quarantinedAt: NOW,
    });
  });

  it('returns a loadout naming a weapon content no longer has, for the caller to repair', async () => {
    const { adapter, repository, warnings } = await setup();
    const id = loadoutKey(PROFILE, 'knight');
    await storeRaw(adapter, {
      schemaVersion: 1,
      id,
      profileId: PROFILE,
      specId: 'knight',
      primaryWeaponId: 'removed-sword',
    });
    expect(await repository.load(PROFILE, 'knight')).toEqual({ primaryWeaponId: 'removed-sword' });
    expect(warnings).toEqual([]);
  });
});
