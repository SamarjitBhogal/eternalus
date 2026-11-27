import type { MapObject } from '../content/maps/mapObjects.types';
import { MapGenerationError } from './MapGenerationError';

/**
 * The map objects that are part of a structure's body (`MapObject.partOf`: the Stronghold's outer
 * walls and its throne, DEC-373 (1)), by the id of that structure's feature, in map object order.
 * `Simulation.spawnStructures` adds their polygons to the structure's `Footprint`
 * (`Footprint.ofBody`), and they get no health of their own.
 *
 * @param mapObjects - The match's map objects.
 * @param structureIds - The ids of the features that become structures.
 * @throws MapGenerationError when a `partOf` object does not block (a body blocks), or when it
 *   names a feature that is no structure. Either would drop the object from every body silently.
 */
export const structureBodyParts = (
  mapObjects: readonly MapObject[],
  structureIds: ReadonlySet<string>,
): ReadonlyMap<string, readonly MapObject[]> => {
  const parts = new Map<string, MapObject[]>();
  for (const object of mapObjects) {
    const { id, partOf } = object;
    if (partOf === undefined) continue;
    if (!object.isBlocking) {
      throw new MapGenerationError(
        `Map object '${id}' is part of '${partOf}' but does not block: a structure's body blocks`,
      );
    }
    if (!structureIds.has(partOf)) {
      throw new MapGenerationError(
        `Map object '${id}' is part of '${partOf}', which is no structure`,
      );
    }
    const body = parts.get(partOf) ?? [];
    body.push(object);
    parts.set(partOf, body);
  }
  return parts;
};
