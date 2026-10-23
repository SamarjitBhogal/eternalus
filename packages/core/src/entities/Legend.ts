import type { LegendDefinition } from '../content/legends/legends.types';
import { SpawnContextReader } from './SpawnContextReader';
import { Unit } from './Unit';
import type { BasicAttack } from './Unit.types';

/** Abstract base for entities of the `legend` family. */
export abstract class Legend extends Unit {
  /** Always `'legend'`. */
  public override get family(): string {
    return 'legend';
  }

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Legend) {
      throw new Error('Legend is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  /**
   * The default weapon's attack when the definition names one (05 §10, §12), else the unit's own.
   *
   * @throws Error when the definition names a weapon but the spawn context has no weapon source.
   */
  protected override basicAttack(context: unknown): BasicAttack | undefined {
    const reader = new SpawnContextReader(this);
    const weaponId =
      reader.placed<LegendDefinition>(context).definition.defaultLoadout?.primaryWeaponId;
    if (weaponId === undefined) {
      return super.basicAttack(context);
    }
    const weapons = reader.weapons(context);
    if (weapons === null) {
      throw new Error(`Legend "${this.id}" needs a weapon source to equip "${weaponId}".`);
    }
    const weapon = weapons.get(weaponId);
    // ponytail: first attack only; "first attack whose reach covers the target" (05 §10) lands with ranged attacks.
    const [attack] = weapon.attacks;
    return attack && { attack, weaponId: weapon.id };
  }
}
