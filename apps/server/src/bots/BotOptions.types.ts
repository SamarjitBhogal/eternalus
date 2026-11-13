/** What a run does: play full Duels (`duel`) or load the matchmaking queue (`queue`). */
type BotMode = 'duel' | 'queue';

/** The run's settings. */
export type BotOptions = {
  readonly url: string;
  readonly players: number;
  readonly seconds: number;
  readonly staggerMs: number;
  readonly mode: BotMode;
  /** In `queue` mode: how many times each bot joins the queue. */
  readonly rounds: number;
};

/** The raw option strings, as `parseArgs` gives them. */
export type BotOptionStrings = {
  readonly url: string;
  readonly players: string;
  readonly seconds: string;
  readonly stagger: string;
  readonly mode: string;
  readonly rounds: string;
};
