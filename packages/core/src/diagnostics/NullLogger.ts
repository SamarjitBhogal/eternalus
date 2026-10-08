import type { Logger } from './Logger.types';

/** A `Logger` that discards every record (benchmarks, tests that do not inspect logs). */
export class NullLogger implements Logger {
  /** Discards the record. */
  public log(): void {
    // Intentionally empty: a null object.
  }
}
