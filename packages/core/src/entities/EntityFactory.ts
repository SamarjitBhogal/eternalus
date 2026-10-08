import { IdGenerator } from '../utils/IdGenerator';
import { Entity } from './Entity';
import { ENTITY_ID_PREFIX } from './EntityFactory.constants';
import type { DefinitionSource } from './EntityFactory.types';
import { EntityRegistry } from './EntityRegistry';

/**
 * Builds and spawns entities by kind through an `EntityRegistry`. Assigns each entity a unique,
 * deterministic id from an `IdGenerator`, so the same creation order yields the same ids. When it
 * has a `DefinitionSource`, it adds the entity's definition to the spawn context, so callers
 * (commands, systems) pass only where and for which team.
 */
export class EntityFactory {
  /**
   * @param registry - Where entity kinds are looked up.
   * @param definitions - Where definitions are looked up by id; without one, spawn contexts are
   *   passed through unchanged.
   * @param ids - Where entity ids come from; a new counter per factory by default.
   */
  public constructor(
    public readonly registry: EntityRegistry = new EntityRegistry(),
    private readonly definitions?: DefinitionSource,
    private readonly ids: IdGenerator = new IdGenerator(),
  ) {}

  /** Constructs the entity registered for `kind`, assigns it the next id and spawns it. */
  public create(kind: string, definitionId: string, spawnContext: unknown): Entity {
    const EntityConstructor = this.registry.get(kind);

    if (EntityConstructor === undefined) {
      throw new Error(`Unknown entity kind "${kind}".`);
    }

    const entity = new EntityConstructor(
      `${ENTITY_ID_PREFIX}${String(this.ids.next())}`,
      definitionId,
    );

    if (!(entity instanceof Entity)) {
      throw new Error(
        `Invalid entity registration for "${kind}": constructor must create an Entity.`,
      );
    }

    entity.spawn(this.withDefinition(definitionId, spawnContext));
    return entity;
  }

  private withDefinition(definitionId: string, spawnContext: unknown): unknown {
    if (
      this.definitions === undefined ||
      !this.definitions.has(definitionId) ||
      typeof spawnContext !== 'object' ||
      spawnContext === null ||
      'definition' in spawnContext
    ) {
      return spawnContext;
    }

    return { ...spawnContext, definition: this.definitions.get(definitionId) };
  }
}
