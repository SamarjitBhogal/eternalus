import type { Logger, LogRecord } from '@eternalus/core';

/** Where lines go; `process.stdout` in production. */
export type LineOutput = { write(text: string): unknown };

/**
 * The server's `Logger`: one JSON line per record on standard output (ADR 0016 point 2; the
 * lint forbids `console`). The only file that touches `process.stdout`.
 */
export class StdoutLogger implements Logger {
  public constructor(private readonly output: LineOutput = process.stdout) {}

  /** Writes `record` as one line. */
  public log(record: LogRecord): void {
    this.output.write(`${JSON.stringify(record)}\n`);
  }
}
