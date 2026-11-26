import type { StructureDefinition } from '../structures/structures.types';
import type { ContentRule } from './ContentValidator.types';

/**
 * A turret needs the ammo it fires (architecture 07 §5): a structure of kind `'turret'` (a wall
 * turret, which fails at spawn without one) or one the turret controller drives (a lane tower,
 * which would never fire) must name an ammo list. So a missing list fails at load, not at the
 * first spawn or in silence. `loadTurrets` checks each ammo it names.
 */
export class TurretNeedsAmmoRule implements ContentRule<StructureDefinition> {
  /** Flags a turret-kind or turret-driven structure that names no `ammo`. */
  public check({ kind, controller, ammo }: StructureDefinition): readonly string[] {
    const isTurret = kind === 'turret' || controller === 'turret';
    return isTurret && ammo === undefined ? ['a turret needs an ammo list'] : [];
  }
}
