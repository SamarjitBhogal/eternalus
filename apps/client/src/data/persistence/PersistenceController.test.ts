import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';

import type { PersistedSettings } from './dto/SettingsDto';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { PersistenceController } from './PersistenceController';
import type { StorageAdapter } from './StorageAdapter.types';
import { STORAGE_SCHEMA } from './schema/migrations';

const SETTINGS: PersistedSettings = {
  bindings: [{ action: 'attack', chords: [{ device: 'mouse', code: '3', label: 'Mouse 4' }] }],
  audio: { master: 1, music: 1, effects: 1 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: false },
};

function controller(adapter: StorageAdapter = new MemoryStorageAdapter()): PersistenceController {
  return new PersistenceController({
    adapter,
    knownActions: new Set(['attack']),
    now: () => 0,
    warn: () => undefined,
  });
}

describe('PersistenceController', () => {
  it('has no settings before the first save', async () => {
    const persistence = controller();
    await persistence.open();

    expect(await persistence.loadSettings()).toEqual({});
  });

  it('keeps saved settings across a close and reopen', async () => {
    const adapter = new MemoryStorageAdapter();
    const first = controller(adapter);
    await first.open();
    await first.saveSettings(SETTINGS);
    first.close();

    const second = controller(adapter);
    await second.open();

    expect(await second.loadSettings()).toEqual(SETTINGS);
  });

  it('has no loadout before the first save', async () => {
    const persistence = controller();
    await persistence.open();

    expect(await persistence.loadLoadouts(['knight'])).toEqual(new Map());
  });

  it('keeps a saved loadout per Legend across a close and reopen', async () => {
    const adapter = new MemoryStorageAdapter();
    const first = controller(adapter);
    await first.open();
    await first.saveLoadout('knight', { primaryWeaponId: 'raptor-talons' });
    await first.saveLoadout('paladin', { primaryWeaponId: 'wuuthrad' });
    first.close();

    const second = controller(adapter);
    await second.open();

    expect(await second.loadLoadouts(['knight', 'paladin', 'oracle'])).toEqual(
      new Map([
        ['knight', { primaryWeaponId: 'raptor-talons' }],
        ['paladin', { primaryWeaponId: 'wuuthrad' }],
      ]),
    );
  });

  it('keeps the guest id across a close and reopen, and has none before the first save', async () => {
    const adapter = new MemoryStorageAdapter();
    const first = controller(adapter);
    await first.open();
    expect(await first.loadGuestId()).toBeNull();
    await first.saveGuestId('123e4567-e89b-42d3-a456-426614174000');
    first.close();

    const second = controller(adapter);
    await second.open();

    expect(await second.loadGuestId()).toBe('123e4567-e89b-42d3-a456-426614174000');
  });

  it('reads a corrupt guest record as missing', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.open(STORAGE_SCHEMA);
    await adapter.transaction(['guest'], 'readwrite', (tx) =>
      tx.put('guest', { schemaVersion: 1, profileId: 'local', guestId: 7 }),
    );
    const persistence = controller(adapter);
    await persistence.open();

    expect(await persistence.loadGuestId()).toBeNull();
  });

  it('round-trips settings on IndexedDB with the real schema', async () => {
    const factory = new IDBFactory();
    const first = controller(new IndexedDbStorageAdapter(factory));
    await first.open();
    await first.saveSettings(SETTINGS);
    first.close();

    const second = controller(new IndexedDbStorageAdapter(factory));
    await second.open();

    expect(await second.loadSettings()).toEqual(SETTINGS);
    second.close();
  });

  it('falls back to memory storage and reports it once through reportError, not warn (14 §10)', async () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const persistence = new PersistenceController({
      adapter: new IndexedDbStorageAdapter(null),
      fallback: {
        build: () => new MemoryStorageAdapter(),
        reportError: (body) => errors.push(body),
      },
      knownActions: new Set(['attack']),
      now: () => 0,
      warn: (body) => warnings.push(body),
    });

    await persistence.open();
    await persistence.saveSettings(SETTINGS);
    await persistence.saveLoadout('knight', { primaryWeaponId: 'raptor-talons' });
    await persistence.saveGuestId('123e4567-e89b-42d3-a456-426614174000');

    expect(await persistence.loadSettings()).toEqual(SETTINGS);
    expect(await persistence.loadLoadouts(['knight'])).toEqual(
      new Map([['knight', { primaryWeaponId: 'raptor-talons' }]]),
    );
    expect(await persistence.loadGuestId()).toBe('123e4567-e89b-42d3-a456-426614174000');
    expect(errors).toEqual([
      'storage unavailable, falling back to memory: progress will not be saved',
    ]);
    expect(warnings).toEqual([]);
  });

  it('rejects a failed open when no fallback is injected', async () => {
    const persistence = controller(new IndexedDbStorageAdapter(null));

    await expect(persistence.open()).rejects.toThrow('IndexedDB is not available');
  });
});
