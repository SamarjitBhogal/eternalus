import { Footprint } from '../../components/Footprint';
import type { MapObject } from '../../content/maps/mapObjects.types';
import { loadTurrets } from '../../content/structures/loadTurrets';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { structureBodiesOf } from '../../map/structureBodiesOf';
import { IdGenerator } from '../../utils/IdGenerator';
import type { GameState } from '../GameState';

/**
 * Builds the map's structures the way `Simulation` does, with ids from 1001 up so the units a test
 * spawns keep `entity-1`, `entity-2`, …, then indexes them. As in `Simulation.spawnStructures`, the
 * structures and their bodies come from `structureBodiesOf`, and each structure gets its body's
 * `Footprint` (`Footprint.ofBody`): its feature's map object of the same id in `mapObjects` when
 * its definition `hasMapFootprint` (a lane tower's fort, a gate), blocking or not, and the objects
 * that are `partOf` it (the Stronghold's outer walls and throne, DEC-386 (1)).
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
  const features = state.world?.definition.features ?? [];
  for (const { feature, own, parts } of structureBodiesOf(
    features,
    mapObjects,
    STRUCTURE_DEFINITIONS,
  )) {
    const { definitionId, position, team, laneId } = feature;
    const structure = factory.create(STRUCTURE_DEFINITIONS.get(definitionId).kind, definitionId, {
      position,
      team,
      ...(laneId !== undefined && { laneId }),
    });
    const footprint = Footprint.ofBody(own, parts);
    if (footprint !== undefined) structure.addComponent(footprint);
    state.entities.add(structure);
  }
  state.indexStructures();
};
