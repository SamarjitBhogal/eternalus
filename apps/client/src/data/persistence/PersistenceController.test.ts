import { describe, expect, it } from 'vitest';

import type { PersistedSettings } from './dto/SettingsDto';
import { IndexedDbStorageAdapter } from './IndexedDbStorageAdapter';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { PersistenceController } from './PersistenceController';
import type { StorageAdapter } from './StorageAdapter.types';

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

    expect(await persistence.loadSettings()).toBeNull();
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

    expect(await persistence.loadLoadouts(['warrior'])).toEqual(new Map());
  });

  it('keeps a saved loadout per class across a close and reopen', async () => {
    const adapter = new MemoryStorageAdapter();
    const first = controller(adapter);
    await first.open();
    await first.saveLoadout('warrior', { primaryWeaponId: 'raptor-talons' });
    first.close();

    const second = controller(adapter);
    await second.open();

    expect(await second.loadLoadouts(['warrior', 'magus'])).toEqual(
      new Map([['warrior', { primaryWeaponId: 'raptor-talons' }]]),
    );
  });

  it('falls back to memory storage with one warning when the adapter does not open', async () => {
    const warnings: string[] = [];
    const persistence = new PersistenceController({
      adapter: new IndexedDbStorageAdapter(null),
      fallback: () => new MemoryStorageAdapter(),
      knownActions: new Set(['attack']),
      now: () => 0,
      warn: (body) => warnings.push(body),
    });

    await persistence.open();
    await persistence.saveSettings(SETTINGS);

    expect(await persistence.loadSettings()).toEqual(SETTINGS);
    expect(warnings).toEqual([
      'storage unavailable, falling back to memory: progress will not be saved',
    ]);
  });

  it('rejects a failed open when no fallback is injected', async () => {
    const persistence = controller(new IndexedDbStorageAdapter(null));

    await expect(persistence.open()).rejects.toThrow('IndexedDB is not available');
  });
});
