import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * A Legend's `classId` names a loaded Legend class (a dangling-reference rule, 04 §5). `classId`
 * is a plain content id, so content can name a class with no definition, such as the reserved
 * `harbinger`; this rule catches it.
 */
export class SpecClassExistsRule implements ContentRule<LegendSpecDefinition> {
  /**
   * Creates the rule over the loaded Legend classes.
   *
   * @param legends - Every Legend class a spec may name.
   */
  public constructor(private readonly legends: ContentCatalogue<LegendDefinition>) {}

  /** Flags a `classId` that is not a Legend class id: `classId "<id>" is not a Legend class`. */
  public check(definition: LegendSpecDefinition): readonly string[] {
    return this.legends.has(definition.classId)
      ? []
      : [`classId "${definition.classId}" is not a Legend class`];
  }
}
