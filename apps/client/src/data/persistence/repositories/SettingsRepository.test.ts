import { describe, expect, it } from 'vitest';

import type { PersistedSettings, SettingsGroup, SettingsGroupDtoV1 } from '../dto/SettingsDto';
import { MemoryStorageAdapter } from '../MemoryStorageAdapter';
import { QUARANTINE_STORE, SETTINGS_STORE, STORAGE_SCHEMA } from '../schema/migrations';
import type { StorageKey } from '../StorageAdapter.types';
import { SettingsRepository } from './SettingsRepository';

const SETTINGS: PersistedSettings = {
  bindings: [{ action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] }],
  audio: { master: 0.8, music: 0.5, effects: 1 },
  video: { fullscreen: true, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: true },
};

function record<G extends SettingsGroup>(
  group: G,
  value: SettingsGroupDtoV1<G>['value'],
): SettingsGroupDtoV1<G> {
  return { schemaVersion: 1, profileId: 'local', group, value };
}

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

function readRaw(adapter: MemoryStorageAdapter, store: string, key: StorageKey): Promise<unknown> {
  return adapter.transaction([store], 'readonly', (tx) => tx.get(store, key));
}

const GROUPS = ['bindings', 'audio', 'video', 'accessibility'] as const;

describe('SettingsRepository', () => {
  it('loads what it saved', async () => {
    const { repository } = await setup();

    await repository.save('p1', SETTINGS);

    expect(await repository.load('p1')).toEqual(SETTINGS);
  });

  it.each([
    ['bindings', { bindings: SETTINGS.bindings }],
    ['audio', SETTINGS.audio],
    ['video', SETTINGS.video],
    ['accessibility', SETTINGS.accessibility],
  ] as const)(
    'stores the %s group as a versioned record at [profileId, group]',
    async (group, value) => {
      const { adapter, repository } = await setup();

      await repository.save('local', SETTINGS);

      expect(await readRaw(adapter, SETTINGS_STORE, ['local', group])).toEqual({
        schemaVersion: 1,
        profileId: 'local',
        group,
        value,
      });
    },
  );

  it('writes all groups in one transaction: a failing write keeps none', async () => {
    const { adapter, repository } = await setup();
    const real = adapter.transaction.bind(adapter);
    let transactions = 0;
    adapter.transaction = (stores, mode, work) => {
      transactions += 1;
      let puts = 0;
      return real(stores, mode, (tx) =>
        work({
          get: (store, key) => tx.get(store, key),
          delete: (store, key) => tx.delete(store, key),
          put: (store, value) => {
            puts += 1;
            return puts === 3 ? Promise.reject(new Error('disk full')) : tx.put(store, value);
          },
        }),
      );
    };

    await expect(repository.save('p1', SETTINGS)).rejects.toThrow('disk full');

    expect(transactions).toBe(1);
    adapter.transaction = real;
    for (const group of GROUPS) {
      expect(await readRaw(adapter, SETTINGS_STORE, ['p1', group])).toBeUndefined();
    }
  });

  it('reports nothing saved as no groups', async () => {
    const { repository } = await setup();

    expect(await repository.load('p1')).toEqual({});
  });

  it('keeps the default of a group that is missing and loads the others', async () => {
    const { adapter, repository } = await setup();
    await repository.save('p1', SETTINGS);
    await adapter.transaction([SETTINGS_STORE], 'readwrite', (tx) =>
      tx.delete(SETTINGS_STORE, ['p1', 'video']),
    );

    const loaded = await repository.load('p1');

    expect(loaded).toEqual({
      bindings: SETTINGS.bindings,
      audio: SETTINGS.audio,
      accessibility: SETTINGS.accessibility,
    });
    expect('video' in loaded).toBe(false);
  });

  it.each([
    ['a bad shape', { ...record('audio', SETTINGS.audio), value: 'loud' }],
    ['a future version', { ...record('audio', SETTINGS.audio), schemaVersion: 9 }],
    ['an out-of-range volume', record('audio', { ...SETTINGS.audio, master: 7 })],
  ])(
    'quarantines an audio record with %s alone and loads the other groups',
    async (_case, corrupt) => {
      const { adapter, repository, warnings } = await setup();
      await repository.save('p1', SETTINGS);
      await storeRaw(adapter, { ...corrupt, profileId: 'p1' });

      const loaded = await repository.load('p1');

      expect(loaded).toEqual({
        bindings: SETTINGS.bindings,
        video: SETTINGS.video,
        accessibility: SETTINGS.accessibility,
      });
      expect(await readRaw(adapter, SETTINGS_STORE, ['p1', 'audio'])).toBeUndefined();
      expect(await readRaw(adapter, SETTINGS_STORE, ['p1', 'video'])).toBeDefined();
      expect(await readRaw(adapter, QUARANTINE_STORE, 1)).toMatchObject({
        store: SETTINGS_STORE,
        key: ['p1', 'audio'],
        quarantinedAt: NOW,
      });
      expect(await readRaw(adapter, QUARANTINE_STORE, 2)).toBeUndefined();
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatch(/^record quarantined: /);
    },
  );

  it('quarantines a bindings record that names an unknown action', async () => {
    const { adapter, repository } = await setup();
    await storeRaw(adapter, record('bindings', { bindings: [{ action: 'fly', chords: [] }] }));

    expect(await repository.load('local')).toEqual({});
    expect(await readRaw(adapter, QUARANTINE_STORE, 1)).toMatchObject({
      key: ['local', 'bindings'],
    });
  });
});
