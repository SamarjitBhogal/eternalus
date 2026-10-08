import type { LogRecord } from '@eternalus/core';

/** Where log records end up: the console, a ring buffer for bug reports, the overlay. */
export interface LogSink {
  /** Takes one record. Must not throw. */
  write(record: LogRecord): void;
}

/** Which records a sink receives (architecture 15 §4). */
export type SinkRoute = {
  readonly sink: LogSink;
  /** Records below this `severityNumber` are not sent (`SEVERITY.WARN`, ...). */
  readonly minSeverity: number;
  /** When set, only records from these scopes are sent (e.g. `core.invariants`). */
  readonly scopes?: readonly string[];
};
