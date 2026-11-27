import type { ContentCatalogue } from '../ContentCatalogue';
import { LEGEND_KINDS } from '../legends/legendKinds';
import type { UnitDefinition } from '../units/units.types';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { UnitDefinitionRule } from './ContentValidator.types';
import { defaultWeaponIdOf } from './defaultWeaponIdOf';

/**
 * Every Legend names a default weapon (`defaultLoadout.primaryWeaponId`, 05 §12) and it must name a
 * loaded weapon: a Legend's damage comes from it (05 §10).
 */
export class KnownWeaponRule implements UnitDefinitionRule {
  /** @param weapons - The weapons a Legend may name. */
  public constructor(private readonly weapons: Pick<ContentCatalogue<WeaponDefinition>, 'has'>) {}

  /** Flags a Legend with no default weapon and a default weapon id that names no weapon. */
  public check(definition: UnitDefinition): readonly string[] {
    const weaponId = defaultWeaponIdOf(definition);
    if (weaponId === null) {
      return LEGEND_KINDS.has(definition) ? ['defaultLoadout.primaryWeaponId is required'] : [];
    }
    return this.weapons.has(weaponId)
      ? []
      : [`defaultLoadout.primaryWeaponId "${weaponId}" names no weapon`];
  }
}
