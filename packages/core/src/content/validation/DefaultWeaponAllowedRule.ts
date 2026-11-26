import { LEGEND_KINDS } from '../legends/legendKinds';
import type { UnitDefinition } from '../units/units.types';
import { isWeaponAllowedFor } from '../weapons/isWeaponAllowedFor';
import type { UnitDefinitionRule, WeaponAccessCatalogue } from './ContentValidator.types';
import { defaultWeaponIdOf } from './defaultWeaponIdOf';

/**
 * A Legend class's default weapon (`defaultLoadout.primaryWeaponId`, 05 §12) must be one that the
 * class may use (`isWeaponAllowedFor`). It skips a mob and a weapon id that does not resolve,
 * because `KnownWeaponRule` reports that (05 §12: "the others skip unresolved ids"). The class
 * sibling of `SpecWeaponAllowedRule`.
 */
export class DefaultWeaponAllowedRule implements UnitDefinitionRule {
  /** @param weapons - The weapons a Legend may name, each with the classes that may use it. */
  public constructor(private readonly weapons: WeaponAccessCatalogue) {}

  /** Flags a Legend class whose default weapon the class may not use. */
  public check(definition: UnitDefinition): readonly string[] {
    const weaponId = defaultWeaponIdOf(definition);
    if (weaponId === null || !LEGEND_KINDS.has(definition) || !this.weapons.has(weaponId)) {
      return [];
    }
    return isWeaponAllowedFor(this.weapons.get(weaponId), definition.id)
      ? []
      : [
          `defaultLoadout.primaryWeaponId "${weaponId}" is not allowed for class "${definition.id}"`,
        ];
  }
}
