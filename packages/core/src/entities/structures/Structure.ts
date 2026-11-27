import { Collider } from '../../components/Collider';
import { Combat } from '../../components/Combat';
import { ControllerBinding } from '../../components/ControllerBinding';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { TurretState } from '../../components/TurretState';
import type { StructureDefinition, StructureKind } from '../../content/structures/structures.types';
import { Entity } from '../Entity';
import type { EntityFamily } from '../Entity.types';
import { SpawnContextReader } from '../SpawnContextReader';

/**
 * Abstract base for static things with health: buildings, walls, gates, turrets, camps and the
 * Cathedral. Installs `Transform`, `Health`, `TeamMembership` and a static `Collider` from a
 * `StructureDefinition` (with its `canShotsFlyOver`, a forest camp), a `ControllerBinding` when the
 * definition names a controller (a turret or a lane tower), as `Unit` does, and a `TurretState` and
 * `Combat` when it names ammo. Concrete structures and their extra components arrive in Phase 2.
 *
 * @see docs/architecture/07-structures-obstacles-and-destructibles.md (The Structure family)
 */
export abstract class Structure extends Entity {
  /** The content kind of this class; one of `StructureKind`. */
  public abstract override readonly kind: StructureKind;

  /** Always `'structure'`. */
  public readonly family: EntityFamily = 'structure';

  private lane: string | null = null;

  private feature: string | null = null;

  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Structure) {
      throw new Error('Structure is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  /** The lane this structure stands on (`MapLane.id`), or `null` off the lanes. */
  public get laneId(): string | null {
    return this.lane;
  }

  /**
   * The map feature this structure was built from (`MapFeature.id`), or `null` for one spawned
   * without a feature. The snapshot carries it, so the HUD binds a tile to its structure.
   */
  public get mapFeatureId(): string | null {
    return this.feature;
  }

  /**
   * Installs the structure components from a placed spawn context.
   *
   * @throws Error when the context is not a placed context for this structure's definition.
   */
  protected installComponents(context: unknown): void {
    const reader = new SpawnContextReader(this);
    const { definition, position, team } = reader.placed<StructureDefinition>(context);
    this.lane = reader.laneId(context);
    this.feature = reader.mapFeatureId(context);

    this.addComponent(new Transform(position, definition.footprintRadius));
    this.addComponent(new Health(definition.baseHealth));
    this.addComponent(new TeamMembership(team));
    const collider = new Collider(
      { kind: 'circle', radius: definition.footprintRadius },
      'structure',
      true,
      { canShotsFlyOver: definition.canShotsFlyOver === true },
    );
    // Walls and gates start the match unbreakable; `StructureSystem` flips it when the rule passes.
    collider.setUnbreakable(definition.breakability.kind !== 'always');
    this.addComponent(collider);
    const binding = ControllerBinding.ofDefinition(definition);
    if (binding !== undefined) {
      this.addComponent(binding);
    }
    if (definition.ammo !== undefined) {
      this.installAmmo(context, definition.ammo);
    }
  }

  /**
   * Installs the parts of a structure that shoots (architecture 07 §5), the same for a wall turret
   * and a lane tower: a `TurretState` with the ammo its definition names (from the spawn context's
   * ammo source) and a `Combat` loaded with the first one's attack. It has no weapon (`weaponId`
   * null).
   *
   * @param ammoIds - The ammo ids its definition names, best first.
   * @throws Error when the context has no ammo source, or an ammo it names is unknown.
   */
  private installAmmo(context: unknown, ammoIds: readonly string[]): void {
    const source = new SpawnContextReader(this).ammo(context);
    if (source === null) {
      throw new Error(`Structure "${this.id}" needs an ammo source to load its ammo.`);
    }
    const ammo = ammoIds.map((id) => {
      if (!source.has(id)) {
        throw new Error(`Structure "${this.id}": unknown ammo "${id}".`);
      }
      return source.get(id);
    });
    const state = new TurretState(ammo);
    this.addComponent(state);
    this.addComponent(new Combat({ basic: state.loaded.attack }, null));
  }
}
