import { Aether } from '../components/Aether';
import { Progression } from '../components/Progression';
import type { LegendDefinition } from '../content/legends/legends.types';
import { SpawnContextReader } from './SpawnContextReader';
import { Unit } from './Unit';
import type { BasicAttack } from './Unit.types';

/** Abstract base for entities of the `legend` family. */
export abstract class Legend extends Unit {
  private spec: string | null = null;

  /** Always `'legend'`. */
  public override get family(): string {
    return 'legend';
  }

  /**
   * The Legend (spec) of its class that its roster slot names (`RosterSlot.specId`), or `null`
   * when the slot names none. It gives no stats. The snapshot carries it, so the client draws the
   * Legend's sprite (DEC-378 (2)).
   */
  public get specId(): string | null {
    return this.spec;
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
   * Installs the unit components, then the legend-only `Aether` (MP) pool and `Progression` (XP
   * and level). Mobs and structures have neither. Keeps the spec the context names.
   */
  protected override installComponents(context: unknown): void {
    super.installComponents(context);

    const reader = new SpawnContextReader(this);
    const { definition } = reader.placed<LegendDefinition>(context);
    this.spec = reader.specId(context);
    this.addComponent(new Aether(definition.baseAether));
    // The id is checked at content load (`KnownLevelCurveRule`); `ProgressionSystem` resolves it.
    this.addComponent(new Progression(definition.levelCurveId));
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
