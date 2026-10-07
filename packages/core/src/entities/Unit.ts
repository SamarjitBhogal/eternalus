import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { Entity } from './Entity';
import { SPAWNABLE_TEAMS } from './Unit.constants';
import type { UnitSpawnContext } from './Unit.types';

/**
 * Abstract base for mobile entities (Legends, mobs, bosses). Installs the shared unit
 * components from the unit's definition: `Transform`, `Health`, `Movement`, `TeamMembership`
 * and a circle `Collider`. Families add their own components by overriding `attachComponents`
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
   * Installs the unit components from a `UnitSpawnContext`.
   *
   * @remarks Takes `unknown` like `Entity` does, so a `Unit` can stand in for any `Entity`
   * (Liskov substitution); the context is checked here instead of narrowed by the signature.
   * @throws Error when the context is not a `UnitSpawnContext`, or its definition is not this
   * entity's definition or kind.
   */
  protected attachComponents(context: unknown): void {
    if (!Unit.isUnitSpawnContext(context)) {
      throw new Error(`Unit "${this.id}" needs a UnitSpawnContext (definition, position, team).`);
    }

    const { definition, position, team } = context;

    if (definition.id !== this.definitionId || definition.kind !== this.kind) {
      throw new Error(
        `Unit "${this.id}" (${this.kind}, ${this.definitionId}) got definition ` +
          `"${definition.id}" (${definition.kind}).`,
      );
    }

    this.add(new Transform(position, definition.footprintRadius));
    this.add(new Health(definition.baseHealth));
    this.add(new Movement(definition.movement));
    this.add(new TeamMembership(team));
    this.add(new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'unit'));
  }

  private static isUnitSpawnContext(context: unknown): context is UnitSpawnContext {
    if (typeof context !== 'object' || context === null) {
      return false;
    }

    const candidate = context as Partial<Record<keyof UnitSpawnContext, unknown>>;
    return (
      typeof candidate.definition === 'object' &&
      candidate.definition !== null &&
      typeof candidate.position === 'object' &&
      candidate.position !== null &&
      SPAWNABLE_TEAMS.some((team) => team === candidate.team)
    );
  }
}
