import { MAP_OBJECT_DEFINITIONS } from '../../content/maps/mapObjectDefinitions';
import type { MapObject } from '../../content/maps/mapObjects.types';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { IdGenerator } from '../../utils/IdGenerator';
import type { GameState } from '../GameState';
import { WorldObjectStore } from '../WorldObjectStore';

/**
 * Gives `state` a `WorldObjectStore` of `objects` with the default map object definitions, with
 * entity ids from 2001 up so they keep clear of `spawnMapStructures` (1001 up) and of the units a
 * test spawns. Returns the ids of the entities it made (one per object with health).
 */
export const spawnWorldObjects = (state: GameState, objects: readonly MapObject[]): string[] => {
  const definitions = new Map(
    Object.values(MAP_OBJECT_DEFINITIONS).map((definition) => [definition.id, definition]),
  );
  const store = new WorldObjectStore({
    objects,
    factory: new EntityFactory(
      createDefaultEntityRegistry(),
      {
        has: (id) => definitions.has(id),
        get: (id) => {
          const definition = definitions.get(id);
          if (definition === undefined) throw new Error('no map object definition');
          return definition;
        },
      },
      new IdGenerator(2000),
    ),
    entities: state.entities,
    definitions: MAP_OBJECT_DEFINITIONS,
  });
  state.worldObjects = store;
  return store.snapshot().flatMap(({ entityId }) => entityId ?? []);
};
