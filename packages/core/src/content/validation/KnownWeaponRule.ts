import type { ContentCatalogue } from '../ContentCatalogue';
import type { UnitDefinition } from '../units/units.types';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/** A Legend's default weapon (`defaultLoadout.primaryWeaponId`) must name a loaded weapon. */
export class KnownWeaponRule implements UnitDefinitionRule {
  /** @param weapons - The weapons a Legend may name. */
  public constructor(private readonly weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has'>) {}

  /** Flags a default weapon id that names no weapon; units without one pass. */
  public check(definition: UnitDefinition): readonly string[] {
    const weaponId = KnownWeaponRule.primaryWeaponIdOf(definition);
    return weaponId === null || this.weapons.has(weaponId)
      ? []
      : [`defaultLoadout.primaryWeaponId "${weaponId}" names no weapon`];
  }

  private static primaryWeaponIdOf(definition: UnitDefinition): string | null {
    if (!('defaultLoadout' in definition)) {
      return null;
    }
    const loadout: unknown = definition.defaultLoadout;
    if (typeof loadout !== 'object' || loadout === null || !('primaryWeaponId' in loadout)) {
      return null;
    }
    return typeof loadout.primaryWeaponId === 'string' ? loadout.primaryWeaponId : null;
  }
}
