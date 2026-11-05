import { Footprint } from '../../components/Footprint';
import type { MapObject } from '../../content/maps/mapObjects.types';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { compareById } from '../../utils/compareById';
import { IdGenerator } from '../../utils/IdGenerator';
import type { GameState } from '../GameState';

/**
 * Builds the map's structures the way `Simulation` does, with ids from 1001 up so the units a test
 * spawns keep `entity-1`, `entity-2`, …, then indexes them. A structure whose feature has a
 * blocking map object of the same id in `mapObjects` (a lane tower's fort) gets its `Footprint`.
 */
export const spawnMapStructures = (
  state: GameState,
  mapObjects: readonly MapObject[] = [],
): void => {
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
  );
  const features = [...(state.world?.definition.features ?? [])].sort((a, b) =>
    compareById(a.id, b.id),
  );
  const solids = new Map(
    mapObjects.filter(({ isBlocking }) => isBlocking).map((object) => [object.id, object]),
  );
  for (const { id, definitionId, position, team, laneId } of features) {
    if (STRUCTURE_DEFINITIONS.has(definitionId)) {
      const { kind } = STRUCTURE_DEFINITIONS.get(definitionId);
      const structure = factory.create(kind, definitionId, {
        position,
        team,
        ...(laneId !== undefined && { laneId }),
      });
      const body = solids.get(id);
      if (body !== undefined) structure.addComponent(new Footprint(body.footprints));
      state.entities.add(structure);
    }
  }
  state.indexStructures();
};
