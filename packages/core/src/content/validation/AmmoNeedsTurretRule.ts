import type { StructureDefinition } from '../structures/structures.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * Only the turret controller fires a structure's ammo (architecture 07 §5, 11 §4.5): a structure
 * that names an ammo list must name `controller: 'turret'`, or its ammo would load and never fire.
 */
export class AmmoNeedsTurretRule implements ContentRule<StructureDefinition> {
  /** Flags a structure with `ammo` whose controller is not the turret controller. */
  public check({ ammo, controller }: StructureDefinition): readonly string[] {
    return ammo !== undefined && controller !== 'turret'
      ? ['a structure with ammo needs controller "turret"']
      : [];
  }
}
