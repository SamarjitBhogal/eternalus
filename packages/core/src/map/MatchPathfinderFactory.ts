import type { GameConfig } from '../config/GameConfig.types';
import type { MapDefinition } from '../content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { AStarPathfinder } from './AStarPathfinder';
import { MatchGrid } from './MatchGrid';
import type { MatchNavigation } from './MatchPathfinderFactory.types';

/**
 * Builds a match's one walkability grid and its A\* (architecture 10 §9). The simulation and any
 * other walker (a scripted player outside the match) build it here, so both read the same ground.
 * `MatchGrid.build` is the one rule that stamps it: the terrain, the blocking features, the
 * blocking map objects and the fort courts (06 §6, DEC-217 (15)).
 */
export class MatchPathfinderFactory {
  /** Builds the grid and the pathfinder for `map` under `config`. */
  public create(
    map: MapDefinition,
    config: GameConfig,
    mapObjects: readonly MapObject[] = [],
  ): MatchNavigation {
    const matchGrid = MatchGrid.build(map, mapObjects, {
      cellSize: config.map.navCellSize,
      features: MAP_FEATURE_DEFINITIONS,
    });
    return {
      grid: matchGrid.grid,
      matchGrid,
      paths: new AStarPathfinder(matchGrid.grid, {
        maxExpansions: config.map.pathMaxExpansions,
        snapCells: config.map.pathSnapCells,
      }),
    };
  }
}
