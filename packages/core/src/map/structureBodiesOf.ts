import type { MapFeature } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { StructureDefinition } from '../content/structures/structures.types';
import { compareById } from '../utils/compareById';
import { structureBodyParts } from './structureBodyParts';

/** A map feature that becomes a structure, with the map objects of its body (07 §1). */
type StructureBody = {
  readonly feature: MapFeature;
  /** Its feature's map object of the same id, when its definition `hasMapFootprint`. */
  readonly own: MapObject | undefined;
  /** The objects that are `partOf` it (`structureBodyParts`), in map object order. */
  readonly parts: readonly MapObject[];
  /** The ids of the blocking objects of its body, `own` first: they share its health pool. */
  readonly bodyIds: readonly string[];
};

/**
 * The map's structure features in feature id order, the order they spawn in, each with the map
 * objects of its body (07 §1): its own map object of the same id when its definition
 * `hasMapFootprint` (a lane tower's fort, DEC-185; a gate's outline, DEC-217 (17); a wall turret's
 * pylon), and the blocking objects that are `partOf` it (the Stronghold's outer walls and throne,
 * DEC-373 (1)). The palace floor is not part of the Stronghold (DEC-344 (4)). A blocking body
 * object has no health of its own (one pool, DEC-185 B); a gate's own object does not block, so it
 * keeps its health. `Simulation.spawnStructures` and the test fixture `spawnMapStructures` both
 * spawn from it and build the `Footprint` (`Footprint.ofBody(own, parts)`), so they cannot drift.
 *
 * @param structures - The structure definitions: a feature whose definition is not one stays map
 *   data (walls, corner camps).
 * @throws MapGenerationError from `structureBodyParts`, for a `partOf` object that does not block
 *   or names a feature that is no structure.
 */
export const structureBodiesOf = (
  features: readonly MapFeature[],
  mapObjects: readonly MapObject[],
  structures: {
    has(id: string): boolean;
    get(id: string): Pick<StructureDefinition, 'hasMapFootprint'>;
  },
): readonly StructureBody[] => {
  const spawned = features
    .filter(({ definitionId }) => structures.has(definitionId))
    .sort((a, b) => compareById(a.id, b.id));
  const objects = new Map(mapObjects.map((object) => [object.id, object]));
  const partsOf = structureBodyParts(mapObjects, new Set(spawned.map(({ id }) => id)));
  return spawned.map((feature) => {
    const { hasMapFootprint } = structures.get(feature.definitionId);
    const own = hasMapFootprint === true ? objects.get(feature.id) : undefined;
    const parts = partsOf.get(feature.id) ?? [];
    const bodyIds = [own, ...parts].flatMap((object) =>
      object?.isBlocking === true ? [object.id] : [],
    );
    return { feature, own, parts, bodyIds };
  });
};
