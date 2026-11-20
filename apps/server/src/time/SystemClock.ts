import type { Clock } from './Clock.types';

/** The production `Clock`: a monotonic process clock. */
export class SystemClock implements Clock {
  /** Milliseconds since the process started timing. */
  public nowMs(): number {
    return performance.now();
  }
}
