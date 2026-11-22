/** The numbers of one queue-load run. */
export type QueueLoadStats = {
  readonly bots: number;
  readonly rounds: number;
  /** Every `queue-join` sent. */
  readonly joins: number;
  /** Joins that ended in `match-found`. */
  readonly paired: number;
  /** Distinct matches the paired joins fell into. */
  readonly matches: number;
  /** Joins still waiting when the run ended (closed, never paired). */
  readonly timeouts: number;
  /** Joins that neither paired nor were answered `queue-waiting`. */
  readonly lost: number;
  /** `match-found` messages heard by a bot that was not queued. */
  readonly duplicates: number;
  /** Time from `queue-join` to `match-found`, in milliseconds. */
  readonly timeToMatchP50Ms: number | null;
  readonly timeToMatchP99Ms: number | null;
  readonly timeToMatchMaxMs: number | null;
  /** Seconds from the first connect to the end of the run. */
  readonly seconds: number;
  /** Bots queued (joining or waiting) at once, sampled while the run polled. */
  readonly queueMax: number;
  readonly queueMean: number;
};
