import { MemoryLogger, SEVERITY, type Logger } from '@eternalus/core';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';

import { setUp } from '../data/logging/__fixtures__/errorReporterSetUp';
import type { ReportOutcome } from '../data/logging/ErrorReporter.types';
import { SinkLogger } from '../data/logging/SinkLogger';
import type { PersistedSettings } from '../data/persistence/dto/SettingsDto';
import { FALLBACK_ERROR } from '../data/persistence/FallbackStorageAdapter.constants';
import { IndexedDbStorageAdapter } from '../data/persistence/IndexedDbStorageAdapter';
import type { StorageAdapter } from '../data/persistence/StorageAdapter.types';
import { createPersistence, type PersistenceDeps } from './createPersistence';

const SETTINGS: PersistedSettings = {
  bindings: [{ action: 'attack', chords: [{ device: 'mouse', code: '3', label: 'Mouse 4' }] }],
  audio: { master: 0.5, music: 0.25, effects: 1 },
  video: { fullscreen: true, renderScale: 1 },
  accessibility: { reduceMotion: true, colourBlindMode: false },
};

function deps(adapter: StorageAdapter, logger: Logger): PersistenceDeps {
  return { adapter, logger, knownActions: new Set(['attack']), now: () => 0 };
}

describe('createPersistence', () => {
  it('reports a fallback to memory as one saved error report, through a WARN page logger (14 §10)', async () => {
    const { writer, reporter } = setUp();
    const outcomes: Promise<ReportOutcome | null>[] = [];
    // As in main.tsx, the reporter gets WARN and worse; here each report's promise is kept.
    const logger = new SinkLogger(
      () => 0,
      [
        {
          sink: {
            write: (record) => {
              outcomes.push(reporter.reportRecord(record));
            },
          },
          minSeverity: SEVERITY.WARN,
        },
      ],
    );
    const persistence = createPersistence(deps(new IndexedDbStorageAdapter(null), logger));

    await persistence.open();
    await Promise.all(outcomes);

    expect(writer.saved).toHaveLength(1);
    expect(writer.saved[0]?.record).toMatchObject({
      severityText: 'ERROR',
      scope: 'client.persistence',
      body: FALLBACK_ERROR,
    });
  });

  it('keeps every settings group and each Legend loadout on IndexedDB across a close and reopen', async () => {
    const factory = new IDBFactory();
    const logger = new MemoryLogger();
    const first = createPersistence(deps(new IndexedDbStorageAdapter(factory), logger));
    await first.open();
    await first.saveSettings(SETTINGS);
    await first.saveLoadout('knight', { primaryWeaponId: 'raptor-talons' });
    await first.saveLoadout('paladin', { primaryWeaponId: 'wuuthrad' });
    first.close();

    const second = createPersistence(deps(new IndexedDbStorageAdapter(factory), logger));
    await second.open();

    expect(await second.loadSettings()).toEqual(SETTINGS);
    expect(await second.loadLoadouts(['knight', 'paladin', 'oracle'])).toEqual(
      new Map([
        ['knight', { primaryWeaponId: 'raptor-talons' }],
        ['paladin', { primaryWeaponId: 'wuuthrad' }],
      ]),
    );
    expect(logger.records).toEqual([]);
    second.close();
  });
});
