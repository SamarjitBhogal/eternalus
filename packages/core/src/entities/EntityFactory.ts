import { Entity } from './Entity';
import { EntityRegistry } from './EntityRegistry';
import { ENTITY_ID_PREFIX } from './EntityFactory.constants';

/**
 * Builds and spawns entities by kind through an `EntityRegistry`. Assigns each entity a unique,
 * deterministic id from a per-factory counter, so the same creation order yields the same ids.
 */
export class EntityFactory {
  private nextId = 1;

  /** @param registry - Where entity kinds are looked up. */
  public constructor(public readonly registry: EntityRegistry = new EntityRegistry()) {}

  /** Constructs the entity registered for `kind`, assigns it the next id and spawns it. */
  public create(kind: string, definitionId: string, spawnContext: unknown): Entity {
    const EntityConstructor = this.registry.get(kind);

    if (EntityConstructor === undefined) {
      throw new Error(`Unknown entity kind "${kind}".`);
    }

    const entity = new EntityConstructor(
      `${ENTITY_ID_PREFIX}${String(this.nextId++)}`,
      definitionId,
    );

    if (!(entity instanceof Entity)) {
      throw new Error(
        `Invalid entity registration for "${kind}": constructor must create an Entity.`,
      );
    }

    entity.spawn(spawnContext);
    return entity;
  }
}
