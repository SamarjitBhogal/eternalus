import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import type { WeaponDefinition } from '../weapons/weapons.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * A spec's own start weapon (`primaryWeaponId`, DEC-374) must name a loaded weapon that the spec's
 * class may use (`allowedClasses` and `uniqueTo`, the spec part of 05 §12 `WeaponAllowedRule`);
 * `null` falls back to the class, which `KnownWeaponRule` checks. The spec sibling of
 * `KnownWeaponRule`.
 */
export class KnownSpecWeaponRule implements ContentRule<LegendSpecDefinition> {
  /** @param weapons - The weapons a spec may name, authored or loaded. */
  public constructor(
    private readonly weapons: Pick<
      ContentCatalogue<Pick<WeaponDefinition, 'id' | 'allowedClasses' | 'uniqueTo'>>,
      'has' | 'get'
    >,
  ) {}

  /** Flags a weapon id that names no weapon, and a weapon that the spec's class may not use. */
  public check(definition: LegendSpecDefinition): readonly string[] {
    const { primaryWeaponId: weaponId, classId } = definition;
    if (weaponId === null) {
      return [];
    }
    if (!this.weapons.has(weaponId)) {
      return [`primaryWeaponId "${weaponId}" names no weapon`];
    }
    const { allowedClasses, uniqueTo } = this.weapons.get(weaponId);
    const isAllowed =
      (allowedClasses === 'any' || allowedClasses.some((kind) => kind === classId)) &&
      (uniqueTo === null || uniqueTo === classId);
    return isAllowed ? [] : [`primaryWeaponId "${weaponId}" is not allowed for class "${classId}"`];
  }
}
