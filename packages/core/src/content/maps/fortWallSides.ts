import type { FortWallRole } from './mapObjects.types';

/** A side of a lane tower's fort. */
export type FortSide = 'north' | 'south' | 'west' | 'east';

/**
 * The side of its fort that a wall of each role stands on; a corner tower stands on none. Read by
 * `fortWallBands` (the north and south bands) and `courtBoxOf` (the court inside the band).
 */
export const FORT_WALL_SIDE: Readonly<Record<FortWallRole, FortSide | null>> = {
  top: 'north',
  left: 'west',
  'left-lower': 'west',
  right: 'east',
  'right-lower': 'east',
  'bottom-left': 'south',
  'bottom-right': 'south',
  'corner-tower': null,
};
