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
 * spawns keep `entity-1`, `entity-2`, …, then indexes them. As in `Simulation.spawnStructures`, a
 * structure whose definition `hasMapFootprint` gets as its `Footprint` the footprints of its
 * feature's map object of the same id in `mapObjects` and of the objects that are `partOf` it (a
 * lane tower's fort walls; the Stronghold's palace), blocking or not.
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
  for (const { id, definitionId, position, team, laneId } of features) {
    if (STRUCTURE_DEFINITIONS.has(definitionId)) {
      const { kind, hasMapFootprint } = STRUCTURE_DEFINITIONS.get(definitionId);
      const structure = factory.create(kind, definitionId, {
        position,
        team,
        mapFeatureId: id,
        ...(laneId !== undefined && { laneId }),
      });
      const body =
        hasMapFootprint === true
          ? mapObjects.filter((object) => object.id === id || object.partOf === id)
          : [];
      if (body.length > 0) {
        structure.addComponent(new Footprint(body.flatMap(({ footprints }) => footprints)));
      }
      state.entities.add(structure);
    }
  }
  state.indexStructures();
};
