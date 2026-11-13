/** The run's settings. */
export type BotOptions = {
  readonly url: string;
  readonly players: number;
  readonly seconds: number;
  readonly staggerMs: number;
};

/** The raw option strings, as `parseArgs` gives them. */
export type BotOptionStrings = {
  readonly url: string;
  readonly players: string;
  readonly seconds: string;
  readonly stagger: string;
};
