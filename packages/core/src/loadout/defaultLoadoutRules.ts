import type { LoadoutRule } from './LoadoutValidator.types';
import { ContentExistsRule } from './rules/ContentExistsRule';
import { WeaponAllowedRule } from './rules/WeaponAllowedRule';

/**
 * The rules `validateLoadout` runs (05 §12), `ContentExistsRule` first. The sketch's
 * `RequiredSlotsRule`, `ClassOwnsAbilityRule`, `VarietyExistsRule`, `NoDuplicateAbilityRule`,
 * `ArtifactClassRule` and `PassiveOwnedRule` join with their slots.
 */
export const createDefaultLoadoutRules = (): readonly LoadoutRule[] => [
  new ContentExistsRule(),
  new WeaponAllowedRule(),
];
