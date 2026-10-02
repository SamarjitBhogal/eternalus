import { Entity } from './Entity.js';
import { EntityRegistry } from './EntityRegistry.js';

export class EntityFactory {
  constructor(registry = new EntityRegistry()) {
    this.registry = registry;
  }

  create(kind, id, definitionId, spawnContext) {
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
