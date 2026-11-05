import type { Health } from '../components/Health';
import type { MapObject, MapObjectKind } from '../content/maps/mapObjects.types';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { EntityFactory } from '../entities/EntityFactory';
import type { EntityStore } from './EntityStore';

/** Runtime record; Health remains the single damageable-state owner. */
export type WorldObjectRecord = {
  readonly object: MapObject;
  readonly entityId: string | null;
  readonly health: Health | null;
};

/** What a `WorldObjectStore` is built from. */
export type WorldObjectStoreOptions = {
  /** The map's placed objects, in placement order. */
  readonly objects: readonly MapObject[];
  /** Spawns each object that has health as an obstacle entity. */
  readonly factory: EntityFactory;
  /** Where the spawned entities go, and where `owners` are looked up. */
  readonly entities: EntityStore;
  /** Each map-object kind's obstacle definition (its health; `null` is indestructible). */
  readonly definitions: Readonly<Record<MapObjectKind, ObstacleDefinition>>;
  /** Map object id → the id of the structure in `entities` the object is the body of. */
  readonly owners?: ReadonlyMap<string, string>;
};
