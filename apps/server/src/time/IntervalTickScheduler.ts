import type { CancelTask, TickScheduler } from './TickScheduler.types';

/** The production `TickScheduler`, over `setInterval`. */
export class IntervalTickScheduler implements TickScheduler {
  /** Repeats `task` every `intervalMs`. */
  public every(intervalMs: number, task: () => void): CancelTask {
    const handle = setInterval(task, intervalMs);
    return () => {
      clearInterval(handle);
    };
  }
}
