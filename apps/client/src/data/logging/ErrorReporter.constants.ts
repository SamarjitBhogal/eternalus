import { type LogRecord, SEVERITY } from '@eternalus/core';

import type { SilentReportRule } from './ErrorReporter.types';

/** The scope of the reporter's own records; it never reports them, so it cannot loop. */
export const REPORTS_SCOPE = 'client.reports';

/**
 * The log records that make a report without a note (ADR 0025 §6, DEC-124 (a)): a record is
 * reported when it matches a rule and no exception. No rule takes INFO `core.commands` (rejected
 * commands) or WARN `client.views` (a kind drawn with the default view): they are not reported.
 */
export const SILENT_REPORT_RULES: readonly SilentReportRule[] = [
  // Every ERROR or FATAL record, any scope. It holds `core.invariants` at ERROR or FATAL (DEC-106
  // "runtime-check failures") and ERROR `client.window` (`logWindowErrors`, uncaught throws).
  { minSeverity: SEVERITY.ERROR },
  // DEC-106 "failed loads".
  {
    minSeverity: SEVERITY.WARN,
    scope: 'client.resources',
    bodies: ['asset failed', 'asset rendition failed'],
  },
  // DEC-106 "broken saved data".
  { minSeverity: SEVERITY.WARN, scope: 'client.persistence', bodies: ['record quarantined'] },
  {
    minSeverity: SEVERITY.WARN,
    scope: 'client.settings',
    bodies: ['settings could not be loaded; using defaults'],
  },
];

/**
 * Records no rule reports: FATAL `client.session` is the record `endCrashedMatch` logs for a
 * crash, which the crash path (`reportCrash`) reports; never twice.
 */
export const SILENT_REPORT_EXCEPTIONS: readonly SilentReportRule[] = [
  { minSeverity: SEVERITY.FATAL, scope: 'client.session' },
];

/** What makes two records the same silent report: one per scope, event name and body. */
export const DEDUPE_KEY_FIELDS = [
  'scope',
  'eventName',
  'body',
] as const satisfies readonly (keyof LogRecord)[];

/** At most this many silent reports per page load. */
export const MAX_SILENT_REPORTS = 20; // TUNE:

/** A report's `logTail` holds this many records. */
export const LOG_TAIL_RECORDS = 64; // TUNE:
