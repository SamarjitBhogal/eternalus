import type { Logger, LogRecord } from './Logger.types';

/** A `Logger` that keeps every record in memory, for tests to assert on. */
export class MemoryLogger implements Logger {
  /** Every record logged so far, oldest first. */
  public readonly records: LogRecord[] = [];

  /** Keeps `record`. */
  public log(record: LogRecord): void {
    this.records.push(record);
  }
}
