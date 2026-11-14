import { BOT_OPTIONS_USAGE } from './BotOptions.constants';
import type { BotOptions, BotOptionStrings } from './BotOptions.types';

/** Turns the CLI's option strings into checked `BotOptions`. */
export class BotOptionsParser {
  /** Parses `values`; throws a `RangeError` with the usage when a number is out of range. */
  public parse(values: BotOptionStrings): BotOptions {
    const players = Number(values.players);
    const seconds = Number(values.seconds);
    const staggerMs = Number(values.stagger);
    if (!Number.isInteger(players) || players < 1 || !(seconds > 0) || !(staggerMs >= 0)) {
      throw new RangeError(BOT_OPTIONS_USAGE);
    }
    return { url: values.url, players, seconds, staggerMs };
  }
}
