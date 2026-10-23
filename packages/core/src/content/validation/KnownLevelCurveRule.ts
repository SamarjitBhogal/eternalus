import type { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_KINDS } from '../legends/legendKinds';
import type { LevelCurveDefinition } from '../progression/progression.types';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/** Every Legend's `levelCurveId` must name a curve in the injected catalogue; other units do not level. */
export class KnownLevelCurveRule implements UnitDefinitionRule {
  /** @param curves - The curves a Legend may name. */
  public constructor(
    private readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has'>,
  ) {}

  /** Flags a Legend whose curve id is missing or unknown. */
  public check(definition: UnitDefinition): readonly string[] {
    if (!LEGEND_KINDS.has(definition)) {
      return [];
    }
    const id: unknown = definition.levelCurveId;
    return typeof id === 'string' && this.curves.has(id)
      ? []
      : [`levelCurveId "${String(id)}" is not a known curve`];
  }
}
