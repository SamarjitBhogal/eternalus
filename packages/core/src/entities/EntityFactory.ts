import { IdGenerator } from '../utils/IdGenerator';
import { Entity } from './Entity';
import { ENTITY_ID_PREFIX } from './EntityFactory.constants';
import type { DefinitionSource, Placement, WeaponSource } from './EntityFactory.types';
import type { EntityRegistry } from './EntityRegistry';

/**
 * Builds and spawns entities (architecture 04 §6). It looks the definition up by id, checks once
 * that the kind builds it, takes a fresh id from an `IdGenerator` (the same creation order yields
 * the same ids) and spawns the entity with its definition and placement. Callers (commands,
 * systems) only say what to build and where.
 */
export class EntityFactory {
  /**
   * @param registry - Where entity kinds are looked up.
   * @param definitions - Where definitions are looked up by id.
   * @param ids - Where entity ids come from; a new counter per factory by default.
   * @param weapons - Where Legends find their weapons; passed in every spawn context when given.
   */
  public constructor(
    public readonly registry: EntityRegistry,
    private readonly definitions: DefinitionSource,
    private readonly ids: IdGenerator = new IdGenerator(),
    private readonly weapons: WeaponSource | null = null,
  ) {}

  /** Whether `kind` is registered and `definitionId` names a definition that `kind` builds. */
  public canCreate(kind: string, definitionId: string): boolean {
    return (
      this.registry.has(kind) &&
      this.definitions.has(definitionId) &&
      this.definitions.get(definitionId).kind === kind
    );
  }

  /**
   * Constructs the entity registered for `kind`, assigns it the next id and spawns it with its
   * definition at `placement`.
   *
   * @throws Error when the kind is unknown, the definition is missing or another kind builds it.
   */
  public create(kind: string, definitionId: string, placement: Placement): Entity {
    const EntityConstructor = this.registry.get(kind);

    if (EntityConstructor === undefined) {
      throw new Error(`Unknown entity kind "${kind}".`);
    }

    if (!this.definitions.has(definitionId)) {
      throw new Error(`Unknown definition "${definitionId}".`);
    }

    const definition = this.definitions.get(definitionId);

    if (definition.kind !== kind) {
      throw new Error(
        `Definition "${definitionId}" is built by "${definition.kind}", not "${kind}".`,
      );
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

    entity.spawn({ ...placement, definition, ...(this.weapons && { weapons: this.weapons }) });
    return entity;
  }
}
