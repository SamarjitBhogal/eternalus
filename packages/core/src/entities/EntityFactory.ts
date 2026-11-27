import { MapFeatureLink } from '../components/MapFeatureLink';
import { IdGenerator } from '../utils/IdGenerator';
import { Entity } from './Entity';
import { ENTITY_ID_PREFIX } from './EntityFactory.constants';
import type { DefinitionSource, LegendEquipment, Placement } from './EntityFactory.types';
import type { EntityRegistry } from './EntityRegistry';

/**
 * Builds and spawns entities (architecture 04 §6). It looks the definition up by id, checks once
 * that the kind builds it, takes a fresh id from an `IdGenerator` (the same creation order yields
 * the same ids) and spawns the entity with its definition and placement. An entity placed from a
 * map feature gets its `MapFeatureLink` here, whatever its family (DEC-252). Callers (commands,
 * systems) only say what to build and where. The spawn's loadout is the one its injected
 * `LoadoutResolver` decides (core's `SpawnLoadoutPolicy`: the placement's when `validateLoadout`
 * accepts it, else the auto-build; 05 §12), so one validator decides what a Legend may carry.
 */
export class EntityFactory {
  /**
   * @param registry - Where entity kinds are looked up.
   * @param definitions - Where definitions are looked up by id.
   * @param ids - Where entity ids come from; a new counter per factory by default.
   * @param equipment - What Legends are equipped from: the weapons (passed in every spawn context)
   *   and the loadout resolver. Without a resolver the placement's loadout is passed on as it is.
   */
  public constructor(
    public readonly registry: EntityRegistry,
    public readonly definitions: DefinitionSource,
    private readonly ids: IdGenerator = new IdGenerator(),
    private readonly equipment: LegendEquipment | null = null,
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

    const loadout =
      this.equipment?.loadouts?.loadoutFor(definitionId, placement.loadout) ?? placement.loadout;
    entity.spawn({
      ...placement,
      definition,
      ...(this.equipment && { weapons: this.equipment.weapons }),
      ...(loadout && { loadout }),
    });
    if (placement.mapFeatureId !== undefined) {
      entity.addComponent(new MapFeatureLink(placement.mapFeatureId));
    }
    return entity;
  }
}
