import type { AStarPathfinder } from './AStarPathfinder';
import type { WorldMap } from './WorldMap';

/** The walkability grid of one match and the A\* that runs over it. */
export type MatchNavigation = {
  readonly grid: WorldMap;
  readonly paths: AStarPathfinder;
};
