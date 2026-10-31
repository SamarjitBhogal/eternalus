import { createDefaultGameConfig, makeLogRecord } from '@eternalus/core';

import type { ErrorReport, MatchEvidence } from '../ErrorReport.types';
import { SILENT_REPORT_RULES } from '../ErrorReporter.constants';

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

/**
 * Whether a WARN record of `scope` with `body` is taken by a named-body row of
 * `SILENT_REPORT_RULES`. The log sites (`ResourceController`, `readOrQuarantine`,
 * `SettingsController`) assert it, so renaming a log body fails their tests instead of silently
 * ending its reports.
 */
export function isReportedSilently(scope: string, body: string): boolean {
  return SILENT_REPORT_RULES.some(
    (rule) => rule.scope === scope && rule.bodies?.includes(body) === true,
  );
}
