import type { BotRosterDefinition } from '../teams/botRoster.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * Every difficulty id a bot roster names exists in the loaded bot difficulties (a
 * dangling-reference rule, 04 §5), so a bad id fails at content load, not at match start.
 */
export class BotRosterDifficultyRule implements ContentRule<BotRosterDefinition> {
  /**
   * Creates the rule over the loaded bot difficulties.
   *
   * @param difficulties - Every bot difficulty by id (`BOT_DIFFICULTIES`).
   */
  public constructor(private readonly difficulties: Readonly<Record<string, unknown>>) {}

  /** Flags each role whose difficulty id is not a loaded bot difficulty. */
  public check(definition: BotRosterDefinition): readonly string[] {
    return Object.entries(definition.difficulties)
      .filter(([, id]) => !Object.hasOwn(this.difficulties, id))
      .map(([role, id]) => `${role} difficulty "${id}" is not a bot difficulty`);
  }
}
