import type { SessionClock } from './SessionClock.types';

/** Test `SessionClock`: time moves only when `advance()` is called. */
export class FakeSessionClock implements SessionClock {
  private time = 0;
  /** Scheduled callbacks in scheduling order. */
  private pending: { readonly dueAt: number; readonly run: () => void }[] = [];

  /** The fake time in milliseconds. */
  public now(): number {
    return this.time;
  }

  /** Queues `callback` for `advance()` to run once `delayMs` has passed. */
  public schedule(callback: () => void, delayMs: number): () => void {
    const timer = { dueAt: this.time + delayMs, run: callback };
    this.pending.push(timer);
    return () => {
      this.pending = this.pending.filter((other) => other !== timer);
    };
  }

  /**
   * Moves time forward by `ms`, running each due callback at its own due time, earliest first
   * (ties in scheduling order). Callbacks may schedule or cancel others.
   */
  public advance(ms: number): void {
    const end = this.time + ms;
    for (;;) {
      const due = this.pending.filter((timer) => timer.dueAt <= end);
      const next = due.reduce<(typeof due)[number] | undefined>(
        (earliest, timer) =>
          earliest === undefined || timer.dueAt < earliest.dueAt ? timer : earliest,
        undefined,
      );
      if (next === undefined) break;
      this.pending = this.pending.filter((timer) => timer !== next);
      this.time = next.dueAt;
      next.run();
    }
    this.time = end;
  }
}
