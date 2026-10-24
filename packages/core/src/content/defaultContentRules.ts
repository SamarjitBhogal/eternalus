import type { ContentCatalogue } from './ContentCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import type { LockedClassDefinition } from './legends/locked/lockedClasses.types';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import { LEVEL_CURVE_CATALOGUE } from './progression/levelCurveCatalogue';
import type { LevelCurveDefinition } from './progression/progression.types';
import type { ContentRule, UnitDefinitionRule } from './validation/ContentValidator.types';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownLevelCurveRule } from './validation/KnownLevelCurveRule';
import { LevelScalingRule } from './validation/LevelScalingRule';
import { PositiveAetherRule } from './validation/PositiveAetherRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';
import { SpecClassExistsRule } from './validation/SpecClassExistsRule';

/**
 * Every shipped content rule. The one place that lists them: a new rule is one line here.
 *
 * @param curves - The level curves a Legend may name; the shipped set by default.
 */
export const createDefaultContentRules = (
  curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has'> = LEVEL_CURVE_CATALOGUE,
): readonly UnitDefinitionRule[] => [
  new KebabCaseIdRule(),
  new PositiveStatsRule(),
  new PositiveAetherRule(),
  new KnownLevelCurveRule(curves),
  new LevelScalingRule(),
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

/** Every shipped locked-class rule. A new locked-class rule is one line here. */
export const createLockedClassRules = (): readonly ContentRule<LockedClassDefinition>[] => [
  new KebabCaseIdRule(),
];
