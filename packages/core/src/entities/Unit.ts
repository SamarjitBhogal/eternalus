import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Vision } from '../components/Vision';
import type { UnitDefinition } from '../content/units/units.types';
import { Entity } from './Entity';
import { SpawnContextReader } from './SpawnContextReader';

/**
 * Abstract base for mobile entities (Legends, mobs, bosses). Installs the shared unit
 * components from the unit's definition: `Transform`, `Health`, `Movement`, `TeamMembership`,
 * a circle `Collider` and `Vision`. Families add their own components by overriding `installComponents`
 * and calling `super`.
 */
export abstract class Unit extends Entity {
  /**
   * @param id - Unique id of this entity instance.
   * @param definitionId - Content definition this entity was built from.
   */
  public constructor(id: string, definitionId: string) {
    if (new.target === Unit) {
      throw new Error('Unit is abstract and cannot be instantiated directly.');
    }

    super(id, definitionId);
  }

  /**
   * Installs the unit components from a placed spawn context.
   *
   * @throws Error when the context is not a placed context for this unit's definition.
   */
  protected installComponents(context: unknown): void {
    const { definition, position, team } = new SpawnContextReader(this).placed<UnitDefinition>(
      context,
    );

    this.addComponent(new Transform(position, definition.footprintRadius));
    this.addComponent(new Health(definition.baseHealth));
    this.addComponent(new Movement(definition.movement));
    this.addComponent(new TeamMembership(team));
    this.addComponent(new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'unit'));
    this.addComponent(new Vision(definition.visionRadius));
  }
}
