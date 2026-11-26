import type { ContentCatalogue } from '../ContentCatalogue';
import type { LegendDefinition } from '../legends/legends.types';
import type { LegendSpecDefinition } from '../legends/specs/legendSpecs.types';
import { isWeaponAllowedFor } from '../weapons/isWeaponAllowedFor';
import type { ContentRule, WeaponAccessCatalogue } from './ContentValidator.types';

/**
 * A spec's own start weapon (`primaryWeaponId`, DEC-374) must be one that the spec's class may use
 * (`isWeaponAllowedFor`): the spec part of 05 §12 `WeaponAllowedRule`. It skips a spec whose
 * weapon id or class id does not resolve, because `KnownSpecWeaponRule` and `SpecClassExistsRule`
 * report those (05 §12: "the others skip unresolved ids"). The spec sibling of
 * `DefaultWeaponAllowedRule`.
 */
export class SpecWeaponAllowedRule implements ContentRule<LegendSpecDefinition> {
  /**
   * @param legends - The loaded Legend classes a spec's `classId` may name.
   * @param weapons - The weapons a spec may name, each with the classes that may use it.
   */
  public constructor(
    private readonly legends: Pick<ContentCatalogue<LegendDefinition>, 'has'>,
    private readonly weapons: WeaponAccessCatalogue,
  ) {}

  /** Flags a start weapon that the spec's class may not use. */
  public check(definition: LegendSpecDefinition): readonly string[] {
    const { primaryWeaponId: weaponId, classId } = definition;
    if (weaponId === null || !this.weapons.has(weaponId) || !this.legends.has(classId)) {
      return [];
    }
    return isWeaponAllowedFor(this.weapons.get(weaponId), classId)
      ? []
      : [`primaryWeaponId "${weaponId}" is not allowed for class "${classId}"`];
  }
}
