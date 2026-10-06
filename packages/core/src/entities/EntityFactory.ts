import { Entity } from './Entity';
import { EntityRegistry } from './EntityRegistry';

/** Builds and spawns entities by kind through an `EntityRegistry`. */
export class EntityFactory {
  /** @param registry - Where entity kinds are looked up. */
  public constructor(public readonly registry: EntityRegistry = new EntityRegistry()) {}

  /** Constructs the entity registered for `kind` and spawns it with `spawnContext`. */
  public create(kind: string, id: string, definitionId: string, spawnContext: unknown): Entity {
    const EntityConstructor = this.registry.get(kind);

    if (EntityConstructor === undefined) {
      throw new Error(`Unknown entity kind "${kind}".`);
    }

    const entity = new EntityConstructor(id, definitionId);

    if (!(entity instanceof Entity)) {
      throw new Error(
        `Invalid entity registration for "${kind}": constructor must create an Entity.`,
      );
    }

    entity.spawn(spawnContext);
    return entity;
  }
}
