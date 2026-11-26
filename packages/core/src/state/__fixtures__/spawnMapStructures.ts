import { Footprint } from '../../components/Footprint';
import type { MapObject } from '../../content/maps/mapObjects.types';
import { loadTurrets } from '../../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { compareById } from '../../utils/compareById';
import { IdGenerator } from '../../utils/IdGenerator';
import type { GameState } from '../GameState';

/**
 * Builds the map's structures the way `Simulation` does, with ids from 1001 up so the units a test
 * spawns keep `entity-1`, `entity-2`, …, then indexes them. As in `Simulation.spawnStructures`, a
 * structure whose definition `hasMapFootprint` gets the `Footprint` of its feature's map object of
 * the same id in `mapObjects` (a lane tower's fort, the Stronghold's palace), blocking or not, with
 * the blocking objects that are `partOf` it as solid polygons (DEC-373 (1)).
 * Turrets carry the shipped ammo.
 */
export const spawnMapStructures = (
  state: GameState,
  mapObjects: readonly MapObject[] = [],
): void => {
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
    null,
    null,
    loadTurrets(state.config.tickRate).ammo,
  );
  const features = [...(state.world?.definition.features ?? [])].sort((a, b) =>
    compareById(a.id, b.id),
  );
  const bodies = new Map(mapObjects.map((object) => [object.id, object]));
  for (const { id, definitionId, position, team, laneId } of features) {
    if (STRUCTURE_DEFINITIONS.has(definitionId)) {
      const { kind, hasMapFootprint } = STRUCTURE_DEFINITIONS.get(definitionId);
      const structure = factory.create(kind, definitionId, {
        position,
        team,
        ...(laneId !== undefined && { laneId }),
      });
      const own = hasMapFootprint === true ? bodies.get(id) : undefined;
      if (own !== undefined) {
        const solid = mapObjects.filter((object) => object.partOf === id && object.isBlocking);
        structure.addComponent(
          new Footprint(own.footprints, {
            isWalkOn: !own.isBlocking,
            solid: solid.flatMap(({ footprints }) => footprints),
          }),
        );
      }
      state.entities.add(structure);
    }
  }
  state.indexStructures();
};
