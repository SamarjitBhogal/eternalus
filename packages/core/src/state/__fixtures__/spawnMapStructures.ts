import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { compareById } from '../../utils/compareById';
import { IdGenerator } from '../../utils/IdGenerator';
import type { GameState } from '../GameState';

/**
 * Builds the map's structures the way `Simulation` does, with ids from 1001 up so the units a test
 * spawns keep `entity-1`, `entity-2`, …, then indexes them.
 */
export const spawnMapStructures = (state: GameState): void => {
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    STRUCTURE_DEFINITIONS,
    new IdGenerator(1000),
  );
  const features = [...(state.map?.features ?? [])].sort((a, b) => compareById(a.id, b.id));
  for (const { definitionId, position, team, laneId } of features) {
    if (STRUCTURE_DEFINITIONS.has(definitionId)) {
      const { kind } = STRUCTURE_DEFINITIONS.get(definitionId);
      state.entities.add(
        factory.create(kind, definitionId, {
          position,
          team,
          ...(laneId !== undefined && { laneId }),
        }),
      );
    }
  }
  state.indexStructures();
};
