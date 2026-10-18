import type { ContentCatalogue } from './ContentCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import type { ContentRule, UnitDefinitionRule } from './validation/ContentValidator.types';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';
import { SpecClassExistsRule } from './validation/SpecClassExistsRule';

/** Every shipped content rule. The one place that lists them: a new rule is one line here. */
export const createDefaultContentRules = (): readonly UnitDefinitionRule[] => [
  new KebabCaseIdRule(),
  new PositiveStatsRule(),
];

/**
 * Every shipped Legend-spec rule. A new spec rule is one line here.
 *
 * @param legends - The loaded Legend classes a spec's `classId` must name.
 */
export const createLegendSpecRules = (
  legends: ContentCatalogue<LegendDefinition>,
): readonly ContentRule<LegendSpecDefinition>[] => [
  new KebabCaseIdRule(),
  new SpecClassExistsRule(legends),
];
