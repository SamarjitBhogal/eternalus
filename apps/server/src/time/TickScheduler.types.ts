/** Stops a repeating task. */
export type CancelTask = () => void;

/**
 * Runs a task at a fixed interval (a port, so a match's tick loop is tested without timers).
 * Match hosting steps every Duel from one scheduler (ADR 0016 point 2).
 */
export interface TickScheduler {
  /** Calls `task` every `intervalMs` until the returned function is called. */
  every(intervalMs: number, task: () => void): CancelTask;
}
