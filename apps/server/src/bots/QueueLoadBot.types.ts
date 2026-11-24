/** Where a queue-load bot is in its round. */
export type QueueLoadPhase = 'idle' | 'joining' | 'waiting' | 'in-match' | 'done';

/** One `queue-join` a bot sent and how it ended. */
export type JoinRecord = {
  readonly sentAtMs: number;
  /** The server answered with `queue-waiting` or `match-found`. */
  isAnswered: boolean;
  matchId: string | null;
  /** Milliseconds from sending the join to hearing `match-found`; `null` until paired. */
  timeToMatchMs: number | null;
};
