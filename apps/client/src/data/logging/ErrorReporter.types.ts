import type { LogRecord } from '@eternalus/core';

import type { MatchEvidence, ReportEnvironment } from './ErrorReport.types';
import type { LogSink } from './LogSink.types';
import type { ReportWriter } from './ReportWriter.types';

/**
 * How a report went: saved (its id and file), or not saved, with the report as JSON text for the
 * player to copy (ADR 0025 §3 copy fallback).
 */
export type ReportOutcome =
  | { readonly status: 'saved'; readonly id: string; readonly file: string }
  | { readonly status: 'copy'; readonly text: string };

/** Everything `ErrorReporter` builds reports from; `main.tsx` passes the page's parts. */
export type ErrorReporterDeps = {
  readonly writer: ReportWriter;
  /** Wall-clock milliseconds (`Date.now`), for `createdAtMs`. */
  readonly now: () => number;
  readonly environment: ReportEnvironment;
  /** The page logger's last `count` records, oldest first (a `RingBufferSink`). */
  readonly pageLogTail: (count: number) => readonly LogRecord[];
  /** The running match's evidence, or `null` outside a match (`SessionController`, ADR 0019). */
  readonly matchEvidence: () => MatchEvidence | null;
  /**
   * Where a silent report that could not be saved goes, as WARN `client.reports` with its full
   * text: the page's `ConsoleSink`, never a logger that routes back to the reporter.
   */
  readonly fallback: LogSink;
};

/**
 * One row of the silent-report table (ADR 0025 §6): a record matches when its severity is at least
 * `minSeverity` and, when given, its scope is `scope` and its body one of `bodies`.
 */
export type SilentReportRule = {
  readonly minSeverity: number;
  readonly scope?: string;
  readonly bodies?: readonly string[];
};
