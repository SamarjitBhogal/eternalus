import type { LogRecord } from '@eternalus/core';

import type { LogSink } from './LogSink.types';

/**
 * Keeps the last `capacity` records for bug reports and the overlay's log tail
 * (architecture 15 §4–§5); older records are dropped.
 */
export class RingBufferSink implements LogSink {
  private readonly records: LogRecord[] = [];

  /**
   * Creates an empty buffer.
   *
   * @param capacity - How many records to keep; a whole number >= 1.
   */
  public constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `RingBufferSink capacity must be a whole number >= 1, got ${String(capacity)}.`,
      );
    }
  }

  /** Keeps `record`, dropping the oldest when full. */
  public write(record: LogRecord): void {
    this.records.push(record);
    if (this.records.length > this.capacity) {
      this.records.shift();
    }
  }

  /** The last `count` records, oldest first. */
  public tail(count: number): readonly LogRecord[] {
    return count <= 0 ? [] : this.records.slice(-count);
  }
}
