import type { Command } from './Command.types';

/**
 * Commands waiting for the next tick, in the order they were enqueued. `drain()` hands them over
 * at the start of a tick; anything enqueued while they are applied (a bot deciding mid-tick) waits
 * for the next drain, so every command applies exactly one tick boundary after it was issued.
 */
export class CommandQueue {
  private pending: Command[] = [];

  /** Number of commands waiting. */
  public get size(): number {
    return this.pending.length;
  }

  /** Queues `command` for the next drain. */
  public enqueue(command: Command): void {
    this.pending.push(command);
  }

  /** Takes every waiting command, oldest first, and empties the queue. */
  public drain(): readonly Command[] {
    const drained = this.pending;
    this.pending = [];
    return drained;
  }
}
