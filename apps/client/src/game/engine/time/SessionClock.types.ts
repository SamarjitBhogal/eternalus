/**
 * Port: wall-clock session time for menus and countdowns. Never simulation ticks, never read by
 * core. Production: `PerformanceSessionClock`; tests: `FakeSessionClock`.
 */
export interface SessionClock {
  /** Milliseconds since an arbitrary origin; monotonic. */
  now(): number;
  /**
   * Runs `callback` once, `delayMs` from now.
   * @returns A function that cancels the callback if it has not run yet.
   */
  schedule(callback: () => void, delayMs: number): () => void;
}
