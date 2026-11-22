import { ALPHABET_SIZE, FIRST_LETTER_CODE } from './BotRun.constants';

/** Names for the bots of a run. */
export class BotNames {
  /** The name of the bot at `index`: A to Z, then P26, P27, and so on. */
  public of(index: number): string {
    return index < ALPHABET_SIZE
      ? String.fromCharCode(FIRST_LETTER_CODE + index)
      : `P${String(index)}`;
  }
}
