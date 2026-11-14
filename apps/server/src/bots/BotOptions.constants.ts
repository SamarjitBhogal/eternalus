/** The defaults of the CLI options, as strings (what `parseArgs` hands back). */
export const BOT_OPTION_DEFAULTS = {
  url: 'ws://127.0.0.1:8787',
  players: '2',
  seconds: '20',
  stagger: '200',
} as const;

/** What a bad option reads like. */
export const BOT_OPTIONS_USAGE =
  '--players must be a whole number >= 1, --seconds > 0, --stagger >= 0';
