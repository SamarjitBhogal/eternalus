import type { ContentCatalogue } from './ContentCatalogue';
import type { UnitDefinitionRule } from './validation/ContentValidator.types';
import { KebabCaseIdRule } from './validation/KebabCaseIdRule';
import { KnownWeaponRule } from './validation/KnownWeaponRule';
import { PositiveStatsRule } from './validation/PositiveStatsRule';
import { WEAPONS } from './weapons/weaponCatalogue';
import type { WeaponDefinition } from './weapons/weapons.types';

/**
 * Every shipped content rule. The one place that lists them: a new rule is one line here.
 *
 * @param weapons - The weapons a Legend's default weapon must name; the shipped set by default.
 */
export const createDefaultContentRules = (
  weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has'> = WEAPONS,
): readonly UnitDefinitionRule[] => [
  new KebabCaseIdRule(),
  new PositiveStatsRule(),
  new KnownWeaponRule(weapons),
];
