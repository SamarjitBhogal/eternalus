import type { LoadoutRule } from './LoadoutValidator.types';
import { ContentExistsRule } from './rules/ContentExistsRule';
import { LegendOfClassRule } from './rules/LegendOfClassRule';
import { WeaponAllowedRule } from './rules/WeaponAllowedRule';

/**
 * The rules `validateLoadout` runs (05 §12): `ContentExistsRule` first, then `LegendOfClassRule`
 * (the Legend, `specId`, is of the loadout's class; DEC-418 (2)), then `WeaponAllowedRule`.
 * The sketch's `RequiredSlotsRule`, `ClassOwnsAbilityRule`,
 * `VarietyExistsRule`, `NoDuplicateAbilityRule`, `ArtifactClassRule` and `PassiveOwnedRule` join
 * with their slots.
 */
export const createDefaultLoadoutRules = (): readonly LoadoutRule[] => [
  new ContentExistsRule(),
  new LegendOfClassRule(),
  new WeaponAllowedRule(),
];
