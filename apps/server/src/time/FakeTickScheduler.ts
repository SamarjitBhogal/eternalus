import type { CancelTask, TickScheduler } from './TickScheduler.types';

/** A `TickScheduler` for tests: tasks run only when a test calls `tick()`. */
export class FakeTickScheduler implements TickScheduler {
  /** The interval each live task was scheduled with. */
  public readonly intervals: number[] = [];
  private readonly tasks = new Map<() => void, number>();

  /** Keeps `task` until it is cancelled. */
  public every(intervalMs: number, task: () => void): CancelTask {
    this.intervals.push(intervalMs);
    this.tasks.set(task, intervalMs);
    return () => {
      this.tasks.delete(task);
    };
  }

  /** How many tasks are scheduled. */
  public get activeCount(): number {
    return this.tasks.size;
  }

  /** Runs every live task once, as one interval elapsing. */
  public tick(): void {
    [...this.tasks.keys()].forEach((task) => {
      task();
    });
  }

  /** Runs the live tasks scheduled every `intervalMs` once: only that interval elapses. */
  public tickEvery(intervalMs: number): void {
    [...this.tasks].forEach(([task, interval]) => {
      if (interval === intervalMs) task();
    });
  }
}
