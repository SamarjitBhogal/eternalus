import type { ContentCatalogue } from '../ContentCatalogue';
import type { IdentifiedDefinition } from '../ContentCatalogue.types';
import { ContentValidationError } from '../ContentValidationError';
import type { ContentRule } from './ContentValidator.types';

/**
 * Checks every definition in a catalogue against a set of rules and reports every broken rule at
 * once.
 *
 * @remarks The validator knows no rule in particular (dependency inversion): rules are injected,
 * so adding a rule is a new `ContentRule` class and one line in `defaultContentRules.ts`. It is
 * generic over the definition type, so units and Legend specs share it (DEC-22).
 */
export class ContentValidator<Definition extends IdentifiedDefinition> {
  /**
   * Creates a validator that checks every definition against `rules`.
   *
   * @param rules - The rules every definition must pass.
   */
  public constructor(private readonly rules: readonly ContentRule<Definition>[]) {}

  /**
   * Runs every rule on every definition in `catalogue`.
   *
   * @throws ContentValidationError listing each broken rule as `<definition id>: <message>`.
   */
  public validate(catalogue: ContentCatalogue<Definition>): void {
    const problems = catalogue
      .all()
      .flatMap((definition) =>
        this.rules.flatMap((rule) =>
          rule.check(definition, catalogue).map((m) => `${definition.id}: ${m}`),
        ),
      );

    if (problems.length > 0) {
      throw new ContentValidationError(`Invalid content: ${problems.join('; ')}`);
    }
  }
}
