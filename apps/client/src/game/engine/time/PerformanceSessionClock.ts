import type { SessionClock } from './SessionClock.types';

/** The browser `SessionClock`: `performance.now()` and `setTimeout`. */
export class PerformanceSessionClock implements SessionClock {
  /** Milliseconds from `performance.now()`. */
  public now(): number {
    return performance.now();
  }

  /** Schedules with `setTimeout`; the returned function clears it. */
  public schedule(callback: () => void, delayMs: number): () => void {
    const handle = setTimeout(callback, delayMs);
    return () => {
      clearTimeout(handle);
    };
  }
}
