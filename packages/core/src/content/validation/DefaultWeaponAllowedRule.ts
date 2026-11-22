import type { ContentCatalogue } from '../ContentCatalogue';
import { isWeaponAllowedFor } from '../weapons/isWeaponAllowedFor';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';
import { KnownWeaponRule } from './KnownWeaponRule';

/**
 * A Legend's default weapon is one its own class may carry (reference 08 "Invariant"): the
 * auto-build is what an invalid or missing loadout falls back to, so it must pass the loadout
 * rules. A missing or unknown weapon is `KnownWeaponRule`'s to report, so this rule skips it.
 */
export class DefaultWeaponAllowedRule implements UnitDefinitionRule {
  /** @param weapons - The weapons a Legend may name. */
  public constructor(
    private readonly weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has' | 'get'>,
  ) {}

  /** Flags a default weapon the Legend's class may not carry. */
  public check(definition: UnitDefinition): readonly string[] {
    const weaponId = KnownWeaponRule.primaryWeaponIdOf(definition);
    if (weaponId === null || !this.weapons.has(weaponId)) {
      return [];
    }
    return isWeaponAllowedFor(this.weapons.get(weaponId), definition.id)
      ? []
      : [
          `defaultLoadout.primaryWeaponId "${weaponId}" may not be carried by class "${definition.id}"`,
        ];
  }
}
