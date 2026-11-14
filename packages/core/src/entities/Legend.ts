import { Abilities } from '../components/Abilities';
import { Aether } from '../components/Aether';
import { Progression } from '../components/Progression';
import type { AbilityKit } from '../content/abilities/AbilityDefinition.types';
import type { LegendDefinition } from '../content/legends/legends.types';
import { LEGEND_SPECS } from '../content/legends/specs/legendSpecCatalogue';
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
   * Installs the unit components, then the legend-only `Aether` (MP) pool, `Progression` (XP
   * and level) and `Abilities` (the ability bar, from the kit). Mobs and structures have none.
   *
   * @throws Error when the context names a Legend spec that does not exist or is of another class.
   */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);

    const reader = new SpawnContextReader(this);
    const { definition } = reader.placed<LegendDefinition>(context);
    this.addComponent(new Aether(definition.baseAether));
    // The id is checked at content load (`KnownLevelCurveRule`); `ProgressionSystem` resolves it.
    this.addComponent(new Progression(definition.levelCurveId));
    // The kit's ids are checked at content load (`KitInPoolRule`, `KnownAbilityRefsRule`).
    this.addComponent(new Abilities(this.kitOf(definition, reader.specId(context))));
  }

  /**
   * The kit this Legend equips (DEC-198, plan arch call 1): its spec's own kit, else its class's
   * `defaultKit`.
   *
   * @throws Error when `specId` names no spec, or a spec of another class.
   */
  private kitOf(definition: LegendDefinition, specId: string | null): AbilityKit {
    if (specId === null) {
      return definition.defaultKit;
    }
    const spec = LEGEND_SPECS.has(specId) ? LEGEND_SPECS.get(specId) : undefined;
    if (spec?.classId !== definition.id) {
      throw new Error(
        `Legend "${this.id}" (class "${definition.id}") cannot use the spec "${specId}": it is not a spec of that class.`,
      );
    }
    return spec.kit ?? definition.defaultKit;
  }

  /**
   * The default weapon's attack (05 §10, §12): a Legend's damage comes from its weapon.
   *
   * @throws Error when the spawn context has no weapon source, or the weapon has no attacks.
   */
  protected override basicAttack(context: unknown): BasicAttack {
    const reader = new SpawnContextReader(this);
    const weaponId =
      reader.placed<LegendDefinition>(context).definition.defaultLoadout.primaryWeaponId;
    const weapons = reader.weapons(context);
    if (weapons === null) {
      throw new Error(`Legend "${this.id}" needs a weapon source to equip "${weaponId}".`);
    }
    const weapon = weapons.get(weaponId);
    // ponytail: first attack only; "first attack whose reach covers the target" (05 §10) lands with ranged attacks.
    const [attack] = weapon.attacks;
    if (attack === undefined) {
      throw new Error(`Legend "${this.id}": weapon "${weapon.id}" has no attacks.`);
    }
    return { attack, weaponId: weapon.id };
  }
}
