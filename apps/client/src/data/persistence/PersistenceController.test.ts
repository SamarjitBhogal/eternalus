import { describe, expect, it } from 'vitest';

import type { PersistedSettings } from './dto/SettingsDto';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { PersistenceController } from './PersistenceController';
import { STORAGE_SCHEMA } from './schema/migrations';

const SETTINGS: PersistedSettings = {
  bindings: [{ action: 'attack', chords: [{ device: 'mouse', code: '3', label: 'Mouse 4' }] }],
  audio: { master: 1, music: 1, effects: 1 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: false },
};

function controller(adapter = new MemoryStorageAdapter()): PersistenceController {
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
});
