import { describe, expect, it } from 'vitest';

import type { PersistedSettings } from './dto/SettingsDto';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { PersistenceController } from './PersistenceController';

const SETTINGS: PersistedSettings = {
  bindings: [{ action: 'attack', chords: [{ device: 'mouse', code: '3', label: 'Mouse 4' }] }],
  audio: { master: 1, music: 1, effects: 1 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: false, colourBlindMode: false },
};

function controller(adapter = new MemoryStorageAdapter()): PersistenceController {
  return new PersistenceController({ adapter, knownActions: new Set(['attack']), now: () => 0 });
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
});
