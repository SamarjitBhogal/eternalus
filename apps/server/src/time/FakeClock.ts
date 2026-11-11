import type { Clock } from './Clock.types';

/** A `Clock` for tests: time moves only when a test says so. */
export class FakeClock implements Clock {
  private now = 0;

  /** The current fake time. */
  public nowMs(): number {
    return this.now;
  }

  /** Moves time forward by `ms`. */
  public advance(ms: number): void {
    this.now += ms;
  }
}
