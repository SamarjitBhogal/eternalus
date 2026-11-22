import { Abilities } from '../components/Abilities';
import { Aether } from '../components/Aether';
import { Loadout } from '../components/Loadout';
import type { HeldWeapon } from '../components/Loadout.types';
import { Progression } from '../components/Progression';
import type { LegendDefinition } from '../content/legends/legends.types';
import { attacksByMode } from '../content/units/attacksByMode';
import { kitOf } from '../content/legends/specs/kitOf';
import type { LegendSpecDefinition } from '../content/legends/specs/legendSpecs.types';
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
   * Installs `Loadout` (the weapons it holds: the class's default weapon and the spec's second
   * weapon) first, so the unit components arm `Combat` with the weapon in hand; then the unit
   * components, then the legend-only `Aether` (MP) pool, `Progression` (XP and level) and
   * `Abilities` (the ability bar, from the kit and the spec's artifacts). Mobs and structures
   * have none.
   *
   * @throws Error when the context names a Legend spec but has no spec source, or a spec that
   *   does not exist or is of another class; or when it has no weapon source, or a weapon has no
   *   attacks.
   */
  protected override installComponents(context: unknown): void {
    const reader = new SpawnContextReader(this);
    const { definition } = reader.placed<LegendDefinition>(context);
    const spec = this.specOf(definition, reader, context);
    const secondaryWeaponId = spec?.secondaryWeaponId ?? null;
    this.addComponent(
      new Loadout(
        this.heldWeapon(definition.defaultLoadout.primaryWeaponId, reader, context),
        secondaryWeaponId === null ? null : this.heldWeapon(secondaryWeaponId, reader, context),
      ),
    );
    super.installComponents(context);

    this.addComponent(new Aether(definition.baseAether));
    // The id is checked at content load (`KnownLevelCurveRule`); `ProgressionSystem` resolves it.
    this.addComponent(new Progression(definition.levelCurveId));
    // The kit's and the artifacts' ids are checked at content load (`KitInPoolRule`,
    // `KnownAbilityRefsRule`).
    this.addComponent(new Abilities(kitOf(spec, definition), spec?.artifacts));
  }

  /**
   * The Legend spec the spawn context names, from the injected spec source (DEC-198, ADR 0026
   * decision 1), or `null` when it names none.
   *
   * @throws Error when it names a spec but has no spec source, or the spec does not exist or is
   *   of another class.
   */
  private specOf(
    definition: LegendDefinition,
    reader: SpawnContextReader,
    context: unknown,
  ): LegendSpecDefinition | null {
    const specId = reader.specId(context);
    if (specId === null) {
      return null;
    }
    const specs = reader.specs(context);
    if (specs === null) {
      throw new Error(`Legend "${this.id}" needs a spec source to use the spec "${specId}".`);
    }
    const spec = specs.has(specId) ? specs.get(specId) : undefined;
    if (spec?.classId !== definition.id) {
      throw new Error(
        `Legend "${this.id}" (class "${definition.id}") cannot use the spec "${specId}": it is not a spec of that class.`,
      );
    }
    return spec;
  }

  /**
   * The attacks of the weapon in hand (05 §10, §12): a Legend's damage comes from its weapon. At
   * spawn that is the class's default weapon, which `Loadout` resolved once.
   */
  protected override basicAttack(): BasicAttack {
    return this.getComponent(Loadout).inHand;
  }

  /**
   * The weapon `weaponId` from the spawn context's weapon source, its attacks by mode.
   *
   * @throws Error when the spawn context has no weapon source, or the weapon has no attacks.
   */
  private heldWeapon(weaponId: string, reader: SpawnContextReader, context: unknown): HeldWeapon {
    const weapons = reader.weapons(context);
    if (weapons === null) {
      throw new Error(`Legend "${this.id}" needs a weapon source to equip "${weaponId}".`);
    }
    const weapon = weapons.get(weaponId);
    const attacks = attacksByMode(
      weapon.attacks,
      reader.placed<LegendDefinition>(context).definition.meleeReach,
    );
    if (attacks === undefined) {
      throw new Error(`Legend "${this.id}": weapon "${weapon.id}" has no attacks.`);
    }
    return { attacks, weaponId: weapon.id };
  }
}
