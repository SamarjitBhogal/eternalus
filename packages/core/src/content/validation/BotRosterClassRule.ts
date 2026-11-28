import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import type { BotRosterDefinition } from '../teams/botRoster.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * Every class a bot roster names is a loaded, playable Legend class (a dangling-reference rule,
 * 04 §5). A locked class is never given to a bot (DEC-48): locked classes are not in the Legend
 * class catalogue, so this rule flags them too.
 */
export class BotRosterClassRule implements ContentRule<BotRosterDefinition> {
  /**
   * Creates the rule over the loaded Legend classes.
   *
   * @param legends - Every Legend class a bot may play.
   */
  public constructor(private readonly legends: ContentCatalogue<LegendDefinition>) {}

  /** Flags each laner class that is not a Legend class id, once per id. */
  public check(definition: BotRosterDefinition): readonly string[] {
    return [...new Set(definition.laners)]
      .filter((classId) => !this.legends.has(classId))
      .map((classId) => `laner class "${classId}" is not a playable Legend class`);
  }
}
