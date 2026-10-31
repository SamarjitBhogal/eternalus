import { createDefaultGameConfig, makeLogRecord } from '@eternalus/core';

import type { ErrorReport, MatchEvidence } from '../ErrorReport.types';

/** A running match's evidence for tests: seed `seed`, tick 90, a tick-0 checkpoint, one record. */
export function fakeMatchEvidence(seed = 7): MatchEvidence {
  return {
    match: {
      seed,
      tick: 90,
      recentCommands: [],
      recentEvents: [],
      replay: {
        seed,
        config: createDefaultGameConfig(),
        commands: [],
        checkpoints: [{ tick: 0, hash: 1 }],
      },
    },
    logTail: [makeLogRecord('TRACE', 'client.match', 'frame', { tick: 90 })],
  };
}

/** A crash report for tests, outside a match; `overrides` replace any field. */
export function fakeErrorReport(overrides: Partial<ErrorReport> = {}): ErrorReport {
  return {
    schemaVersion: 1,
    kind: 'crash',
    createdAtMs: 1_000,
    error: { message: 'boom', stack: null, source: 'game-loop' },
    record: null,
    match: null,
    logTail: [],
    environment: {
      gameVersion: '0.0.0',
      commit: 'abc1234',
      contentVersion: null,
      userAgent: 'test',
    },
    note: null,
    ...overrides,
  };
}
