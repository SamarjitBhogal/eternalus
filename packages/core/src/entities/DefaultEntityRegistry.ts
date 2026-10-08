import { DEFAULT_ENTITY_MODULES } from './DefaultEntityRegistry.constants';
import { EntityRegistry } from './EntityRegistry';
import type { EntityModule } from './EntityRegistry.types';

/**
 * The registry of every shipped entity kind, built from entity modules.
 *
 * @remarks `EntityRegistry` and `EntityFactory` stay closed to change (open/closed). Each family
 * registers its own kinds in its `EntityModule`, so adding a kind is a new class, a content
 * definition and one `register` line in that family's module; nothing outside the family changes.
 * Lookups are a single `Map` read per spawn, with no `switch` or `instanceof` chain on kinds.
 * @see docs/architecture/04-entity-architecture.md (EntityFactory and EntityRegistry)
 */
export class DefaultEntityRegistry extends EntityRegistry {
  /**
   * Creates the registry and installs every module.
   *
   * @param modules - The modules to install; every shipped module by default.
   */
  public constructor(modules: readonly EntityModule[] = DEFAULT_ENTITY_MODULES) {
    super();

    for (const module of modules) {
      module.register(this);
    }
  }
}
