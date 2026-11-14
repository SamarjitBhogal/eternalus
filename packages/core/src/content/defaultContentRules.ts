import { ABILITIES } from './abilities/abilityCatalogue';
import type { AbilityBase } from './abilities/AbilityDefinition.types';
import { BOT_DIFFICULTIES } from './ai/difficulties/botDifficulties';
import type { ContentCatalogue } from './ContentCatalogue';
import type { LegendDefinition } from './legends/legends.types';
import type { LockedClassDefinition } from './legends/locked/lockedClasses.types';
import type { LegendSpecDefinition } from './legends/specs/legendSpecs.types';
import { LEGEND_CLASSES } from './legends/legendCatalogue';
import { LEVEL_CURVE_CATALOGUE } from './progression/levelCurveCatalogue';
import type { LevelCurveDefinition } from './progression/progression.types';
import type { BotRosterDefinition } from './teams/botRoster.types';
import { BotRosterClassRule } from './validation/BotRosterClassRule';
import { BotRosterDifficultyRule } from './validation/BotRosterDifficultyRule';
import type { ContentRule, UnitDefinitionRule } from './validation/ContentValidator.types';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KitInPoolRule } from './validation/KitInPoolRule';
import { KnownAbilityRefsRule } from './validation/KnownAbilityRefsRule';
import { KnownLevelCurveRule } from './validation/KnownLevelCurveRule';
import { KnownWeaponRule } from './validation/KnownWeaponRule';
import { LevelScalingRule } from './validation/LevelScalingRule';
import { PositiveAetherRule } from './validation/PositiveAetherRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';
import { RoleRatingRangeRule } from './validation/RoleRatingRangeRule';
import { SpecClassExistsRule } from './validation/SpecClassExistsRule';
import { WEAPONS } from './weapons/weaponCatalogue';
import type { WeaponDefinition } from './weapons/weapons.types';

/**
 * Every shipped content rule. The one place that lists them: a new rule is one line here.
 *
 * @param curves - The level curves a Legend may name; the shipped set by default.
 * @param weapons - The weapons a Legend's default weapon must name; the shipped set by default.
 * @param abilities - The abilities a Legend class's pool and default kit may name; the shipped set
 *   by default.
 * @param legends - The Legend classes the ability rules read pools from; the shipped set by default.
 */
export const createDefaultContentRules = (
  curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'has'> = LEVEL_CURVE_CATALOGUE,
  weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has'> = WEAPONS,
  abilities: Pick<ContentCatalogue<AbilityBase>, 'has' | 'get'> = ABILITIES,
  legends: Pick<ContentCatalogue<LegendDefinition>, 'has' | 'get'> = LEGEND_CLASSES,
): readonly UnitDefinitionRule[] => [
  new KebabCaseIdRule(),
  new PositiveStatsRule(),
  new PositiveAetherRule(),
  new KnownLevelCurveRule(curves),
  new LevelScalingRule(),
  new KnownWeaponRule(weapons),
  new KnownAbilityRefsRule(abilities, legends),
  new KitInPoolRule(legends),
];

/**
 * Every shipped Legend-spec rule. A new spec rule is one line here.
 *
 * @param legends - The loaded Legend classes a spec's `classId` must name.
 * @param abilities - The abilities a spec's own kit may name; the shipped set by default.
 */
export const createLegendSpecRules = (
  legends: ContentCatalogue<LegendDefinition>,
  abilities: Pick<ContentCatalogue<AbilityBase>, 'has' | 'get'> = ABILITIES,
): readonly ContentRule<LegendSpecDefinition>[] => [
  new KebabCaseIdRule(),
  new SpecClassExistsRule(legends),
  new RoleRatingRangeRule(),
  new KnownAbilityRefsRule(abilities, legends),
  new KitInPoolRule(legends),
];

/** Every shipped locked-class rule. A new locked-class rule is one line here. */
export const createLockedClassRules = (): readonly ContentRule<LockedClassDefinition>[] => [
  new KebabCaseIdRule(),
];

/**
 * Every shipped bot-roster rule. A new bot-roster rule is one line here.
 *
 * @param legends - The loaded Legend classes every laner must name.
 * @param difficulties - The loaded bot difficulties each role must name (DEC-149).
 */
export const createBotRosterRules = (
  legends: ContentCatalogue<LegendDefinition>,
  difficulties: Readonly<Record<string, unknown>> = BOT_DIFFICULTIES,
): readonly ContentRule<BotRosterDefinition>[] => [
  new KebabCaseIdRule(),
  new BotRosterClassRule(legends),
  new BotRosterDifficultyRule(difficulties),
];
