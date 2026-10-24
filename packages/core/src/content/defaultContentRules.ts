import type { ContentCatalogue } from './ContentCatalogue';
import { LEVEL_CURVE_CATALOGUE } from './progression/levelCurveCatalogue';
import type { LevelCurveDefinition } from './progression/progression.types';
import type { UnitDefinitionRule } from './validation/ContentValidator.types';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownLevelCurveRule } from './validation/KnownLevelCurveRule';
import { LevelScalingRule } from './validation/LevelScalingRule';
import { PositiveAetherRule } from './validation/PositiveAetherRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';

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
