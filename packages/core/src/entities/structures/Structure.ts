import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import type { StructureDefinition, StructureKind } from '../../content/structures/structures.types';
import { Entity } from '../Entity';
import type { EntityFamily } from '../Entity.types';
import { SpawnContextReader } from '../SpawnContextReader';

/**
 * Abstract base for static things with health: buildings, walls, gates, turrets, camps and the
 * Cathedral. Installs `Transform`, `Health`, `TeamMembership` and a static `Collider` from a
 * `StructureDefinition`. Concrete structures and their extra components arrive in Phase 2.
 *
 * @see docs/architecture/07-structures-obstacles-and-destructibles.md (The Structure family)
 */
export abstract class Structure extends Entity {
  /** The content kind of this class; one of `StructureKind`. */
  public abstract override readonly kind: StructureKind;

  /** Always `'structure'`. */
  public readonly family: EntityFamily = 'structure';

  private lane: string | null = null;

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
   * Installs the structure components from a placed spawn context.
   *
   * @throws Error when the context is not a placed context for this structure's definition.
   */
  protected installComponents(context: unknown): void {
    const reader = new SpawnContextReader(this);
    const { definition, position, team } = reader.placed<StructureDefinition>(context);
    this.lane = reader.laneId(context);

    this.addComponent(new Transform(position, definition.footprintRadius));
    this.addComponent(new Health(definition.baseHealth));
    this.addComponent(new TeamMembership(team));
    const collider = new Collider(
      { kind: 'circle', radius: definition.footprintRadius },
      'structure',
      true,
    );
    // Walls and gates start the match unbreakable; `StructureSystem` flips it when the rule passes.
    collider.setUnbreakable(definition.breakability.kind !== 'always');
    this.addComponent(collider);
  }
}
