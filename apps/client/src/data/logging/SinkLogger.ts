import type { Logger, LogRecord } from '@eternalus/core';

import type { SinkRoute } from './LogSink.types';

/**
 * The client's `Logger` (architecture 15 §4): stamps each record with the wall-clock time and
 * fans it out to every sink whose severity and scope filters it passes. Core never sees a sink.
 */
export class SinkLogger implements Logger {
  /**
   * Creates a logger over `routes`.
   *
   * @param now - Milliseconds from the engine clock; core never reads the time itself.
   * @param routes - Each sink with its filters.
   */
  public constructor(
    private readonly now: () => number,
    private readonly routes: readonly SinkRoute[],
  ) {}

  /** Stamps `record` and writes it to every route it passes. */
  public log(record: LogRecord): void {
    const stamped: LogRecord = { ...record, timestampMs: this.now() };
    for (const { sink, minSeverity, scopes } of this.routes) {
      if (stamped.severityNumber >= minSeverity && (scopes?.includes(stamped.scope) ?? true)) {
        sink.write(stamped);
      }
    }
  }
}
