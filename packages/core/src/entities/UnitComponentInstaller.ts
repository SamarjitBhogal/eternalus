import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Vision } from '../components/Vision';
import type { UnitDefinition } from '../content/units/units.types';
import { SpawnContextReader } from './SpawnContextReader';
import type { Unit } from './Unit';

/**
 * Installs the components every unit has, from a `UnitSpawnContext`: `Transform`, `Health`,
 * `Movement`, `TeamMembership`, a circle `Collider` on the unit layer and `Vision`.
 *
 * @remarks Composition instead of inheritance: concrete units (Legends, mobs) call it from their
 * `installComponents` hook, so `Unit`, `Legend` and `Mob` keep their original contract and any
 * class can extend them with its own components.
 */
export class UnitComponentInstaller {
  /** Creates an installer for `unit`. */
  public constructor(private readonly unit: Unit) {}

  /**
   * Reads `context` and adds the unit components to the unit.
   *
   * @throws Error when the context is not a placed context for this unit's definition.
   */
  public install(context: unknown): void {
    const { definition, position, team } = new SpawnContextReader(this.unit).placed<UnitDefinition>(
      context,
    );

    this.unit.addComponent(new Transform(position, definition.footprintRadius));
    this.unit.addComponent(new Health(definition.baseHealth));
    this.unit.addComponent(new Movement(definition.movement));
    this.unit.addComponent(new TeamMembership(team));
    this.unit.addComponent(
      new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'unit'),
    );
    this.unit.addComponent(new Vision(definition.visionRadius));
  }
}
