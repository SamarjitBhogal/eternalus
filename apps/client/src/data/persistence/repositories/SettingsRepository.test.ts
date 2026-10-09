import { describe, expect, it } from 'vitest';

import type { PersistedSettings } from '../dto/SettingsDto';
import { MemoryStorageAdapter } from '../MemoryStorageAdapter';
import { QUARANTINE_STORE, SETTINGS_STORE, STORAGE_SCHEMA } from '../schema/migrations';
import { SettingsRepository } from './SettingsRepository';

const SETTINGS: PersistedSettings = {
  bindings: [{ action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] }],
  audio: { master: 0.8, music: 0.5, effects: 1 },
  video: { fullscreen: true, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: true },
};

const NOW = 1_760_000_000_000;

async function setup(): Promise<{
  adapter: MemoryStorageAdapter;
  repository: SettingsRepository;
  warnings: string[];
}> {
  const adapter = new MemoryStorageAdapter();
  await adapter.open(STORAGE_SCHEMA);
  const warnings: string[] = [];
  const repository = new SettingsRepository(
    adapter,
    new Set(['move-up']),
    () => NOW,
    (body, attributes) => {
      warnings.push(`${body}: ${String(attributes.reason)}`);
    },
  );
  return { adapter, repository, warnings };
}

function storeRaw(adapter: MemoryStorageAdapter, value: unknown): Promise<void> {
  return adapter.transaction([SETTINGS_STORE], 'readwrite', (tx) => tx.put(SETTINGS_STORE, value));
}

function readRaw(
  adapter: MemoryStorageAdapter,
  store: string,
  key: string | number,
): Promise<unknown> {
  return adapter.transaction([store], 'readonly', (tx) => tx.get(store, key));
}

describe('SettingsRepository', () => {
  it('loads what it saved', async () => {
    const { repository } = await setup();

    await repository.save('p1', SETTINGS);

    expect(await repository.load('p1')).toEqual(SETTINGS);
  });

  it('stores a versioned record keyed by profile', async () => {
    const { adapter, repository } = await setup();

    await repository.save('p1', SETTINGS);

    expect(await readRaw(adapter, SETTINGS_STORE, 'p1')).toEqual({
      schemaVersion: 1,
      profileId: 'p1',
      ...SETTINGS,
    });
  });

  it('reports nothing saved as null', async () => {
    const { repository } = await setup();

    expect(await repository.load('p1')).toBeNull();
  });

  it.each([
    ['a bad shape', { profileId: 'p1', schemaVersion: 1, bindings: 'W' }],
    [
      'an unknown action',
      { ...SETTINGS, schemaVersion: 1, profileId: 'p1', bindings: [{ action: 'fly', chords: [] }] },
    ],
    ['a future version', { ...SETTINGS, schemaVersion: 9, profileId: 'p1' }],
  ])('quarantines a record with %s and reports it as missing', async (_case, corrupt) => {
    const { adapter, repository, warnings } = await setup();
    await storeRaw(adapter, corrupt);

    const loaded = await repository.load('p1');

    expect(loaded).toBeNull();
    expect(await readRaw(adapter, SETTINGS_STORE, 'p1')).toBeUndefined();
    expect(await readRaw(adapter, QUARANTINE_STORE, 1)).toMatchObject({
      store: SETTINGS_STORE,
      key: 'p1',
      quarantinedAt: NOW,
      value: corrupt,
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^record quarantined: /);
  });
});
