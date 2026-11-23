import type { ContentCatalogue } from '../ContentCatalogue';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * Every status a unit is immune to (`statusImmunities`, the Sentinel's Fear immunity, DEC-207)
 * names a loaded status: a typo fails at load, not as an immunity that never refuses anything.
 */
export class KnownStatusRefsRule implements UnitDefinitionRule {
  /** @param statuses - The statuses an immunity may name. */
  public constructor(private readonly statuses: Pick<ContentCatalogue<{ id: string }>, 'has'>) {}

  /** Flags each immunity that names no status. */
  public check({ statusImmunities = [] }: UnitDefinition): readonly string[] {
    return statusImmunities
      .filter((statusId) => !this.statuses.has(statusId))
      .map((statusId) => `statusImmunities "${statusId}" names no status`);
  }
}
