import type { LogContext, LogRecord, Replay } from '@eternalus/core';

/** What a report says went wrong (ADR 0025 §3). */
export type ReportedError = {
  readonly message: string;
  readonly stack: string | null;
  /** `'game-loop'`, `'screen:<ScreenName>'` or the scope of the log record behind the report. */
  readonly source: string;
};

/** The match a report was made in: enough to reproduce it (ADR 0025 §3, §4). */
type ReportedMatch = {
  readonly seed: number;
  /** The ticks the simulation had completed. */
  readonly tick: number;
  readonly recentCommands: LogContext['recentCommands'];
  readonly recentEvents: LogContext['recentEvents'];
  /** `Simulation.exportReplay()`: the whole match so far. */
  readonly replay: Replay;
};

/** Where the page runs (ADR 0025 §3). */
export type ReportEnvironment = {
  /** The root `package.json` version. */
  readonly gameVersion: string;
  /** The short git commit the page was served from, or `'unknown'`. */
  readonly commit: string;
  /** `null` until core has a content version (15 §13). */
  readonly contentVersion: null;
  readonly userAgent: string;
};

/**
 * One crash or error, as the dev server saves it to `logs/errors/` (ADR 0025 §3). Plain data: it
 * is posted as JSON or copied as text.
 */
export type ErrorReport = {
  readonly schemaVersion: 1;
  /** A crash asks the player for a note; an error is silent. */
  readonly kind: 'crash' | 'error';
  /** Wall-clock time (`Date.now()` in the page) when the report was made. */
  readonly createdAtMs: number;
  readonly error: ReportedError;
  /** The log record behind a silent report; `null` for a crash. */
  readonly record: LogRecord | null;
  /** `null` when no match was running. */
  readonly match: ReportedMatch | null;
  /** The last log records, oldest first. */
  readonly logTail: readonly LogRecord[];
  readonly environment: ReportEnvironment;
  /** What the player wrote about a crash, or `null`. */
  readonly note: string | null;
};

/**
 * What a running match gives a report (`RunningMatch.evidence()`): the match part of the report
 * and the match's own log records (its TRACE ring), oldest first.
 */
export type MatchEvidence = {
  readonly match: ReportedMatch;
  readonly logTail: readonly LogRecord[];
};
