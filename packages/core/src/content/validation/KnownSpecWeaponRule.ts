import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * A spec's own start weapon (`primaryWeaponId`, DEC-387) must name a loaded weapon; `null` falls
 * back to the class, which `KnownWeaponRule` checks. The spec sibling of `KnownWeaponRule`;
 * `SpecWeaponAllowedRule` checks that the spec's class may use the weapon.
 */
export class KnownSpecWeaponRule implements ContentRule<LegendSpecDefinition> {
  /** @param weapons - The weapons a spec may name. */
  public constructor(private readonly weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has'>) {}

  /** Flags a weapon id that names no weapon. */
  public check(definition: LegendSpecDefinition): readonly string[] {
    const weaponId = definition.primaryWeaponId;
    return weaponId === null || this.weapons.has(weaponId)
      ? []
      : [`primaryWeaponId "${weaponId}" names no weapon`];
  }
}
