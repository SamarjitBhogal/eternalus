import type { AStarPathfinder } from './AStarPathfinder';
import type { MatchGrid } from './MatchGrid';
import type { WorldMap } from './WorldMap';

/** The walkability grid of one match and the A\* that runs over it. */
export type MatchNavigation = {
  /** The cells: `matchGrid.grid`, for a walker that only reads them. */
  readonly grid: WorldMap;
  /** The grid with its stamps, so the match can reopen a dead structure's ground. */
  readonly matchGrid: MatchGrid;
  readonly paths: AStarPathfinder;
};
