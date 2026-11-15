import type { GameConfig } from '../config/GameConfig.types';
import type { MapDefinition } from '../content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { AStarPathfinder } from './AStarPathfinder';
import type { MatchNavigation } from './MatchPathfinderFactory.types';
import { WorldMap } from './WorldMap';

/**
 * Builds a match's one walkability grid and its A\* (architecture 10 §9). The simulation and any
 * other walker (a scripted player outside the match) build it here, so both read the same ground.
 * With `mapObjects`, the grid also blocks what the collision system blocks (06 §6): every blocking
 * object's footprints, minus its passages. A feature whose object is walkable (a Stronghold's
 * floor, whose walls and furniture are objects of their own) is not stamped; other blocking
 * features keep their stamp, which also fills a tower's hollow core so no path ends in a pocket
 * the walls close off.
 */
export class MatchPathfinderFactory {
  /** Builds the grid and the pathfinder for `map` under `config`. */
  public create(
    map: MapDefinition,
    config: GameConfig,
    mapObjects: readonly MapObject[] = [],
  ): MatchNavigation {
    const walkable = new Set(
      mapObjects.filter(({ isBlocking }) => !isBlocking).map(({ id }) => id),
    );
    const grid = WorldMap.fromDefinition(
      { ...map, features: map.features.filter(({ id }) => !walkable.has(id)) },
      config.map.navCellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    );
    for (const object of mapObjects.filter(({ isBlocking }) => isBlocking)) {
      for (const footprint of object.footprints) {
        grid.stampFootprint(footprint, object.passages);
      }
    }
    return {
      grid,
      paths: new AStarPathfinder(grid, {
        maxExpansions: config.map.pathMaxExpansions,
        snapCells: config.map.pathSnapCells,
      }),
    };
  }
}
