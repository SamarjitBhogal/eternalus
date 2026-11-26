import type { GameConfig } from '../config/GameConfig.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { MapDefinition } from '../content/maps/maps.types';
import { SPACE_CELL_SIZE } from '../content/ai/hordeSteering';
import type { AStarPathfinder } from '../map/AStarPathfinder';
import { MatchPathfinderFactory } from '../map/MatchPathfinderFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { MatchWorld } from '../state/MatchWorld';

/**
 * The map's spatial pieces: the match world (its one walkability grid shared by the lane flow
 * fields and A\* for Legends), the neighbour index and A\*. All `null` without a map. With
 * `mapObjects`, the grid also blocks what the collision system blocks (06 §6): every blocking
 * object's footprints, minus its passages. A feature whose object is walkable (a Stronghold's
 * floor, whose walls and furniture are objects of their own) is not stamped; other blocking
 * features keep their stamp, which also fills a tower's hollow core so no path ends in a pocket
 * the walls close off.
 */
export const buildMatchWorld = (
  map: MapDefinition | undefined,
  config: GameConfig,
  mapObjects: readonly MapObject[] = [],
): {
  readonly space: SpaceIndex | null;
  readonly world: MatchWorld | null;
  readonly paths: AStarPathfinder | null;
} => {
  if (map === undefined) {
    return { space: null, world: null, paths: null };
  }
  const { grid, paths } = new MatchPathfinderFactory().create(map, config, mapObjects);
  return {
    space: new SpaceIndex(map.width, map.height, SPACE_CELL_SIZE),
    world: new MatchWorld(map, grid),
    paths,
  };
};
