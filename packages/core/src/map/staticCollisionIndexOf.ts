import type { MapObject } from '../content/maps/mapObjects.types';
import type { MapDefinition } from '../content/maps/maps.types';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';

/**
 * The one static collision index of a match (architecture 10 §5): every footprint of each blocking
 * map object, with its passages, and every terrain shape. `Simulation` builds it once and shares
 * it between `CollisionSystem`, which moves units against it and removes destroyed objects from
 * it, and the match world's collision sweep (`MatchWorld.collisions`), which cuts a dash with it.
 */
export function staticCollisionIndexOf(
  map: MapDefinition,
  objects: readonly MapObject[],
): StaticCollisionIndex {
  const shapes = objects.flatMap((object) =>
    object.isBlocking
      ? object.footprints.map((polygon) => ({
          id: object.id,
          polygon,
          ...(object.passages === undefined ? {} : { passages: object.passages }),
        }))
      : [],
  );
  return new StaticCollisionIndex([
    ...shapes,
    ...map.terrain.map((terrain) => ({ id: terrain.id, polygon: terrain.shape })),
  ]);
}
