import { FORT_WALL_SIDE } from '../content/maps/fortWallSides';
import type { MapObject } from '../content/maps/mapObjects.types';
import { boundsOf } from '../utils/geometry';
import type { Rect } from '../utils/geometry.types';

/**
 * The court of a lane tower's fort: the box inside its wall band, so a doorway, which lies in the
 * band, is not in it (DEC-324 (2)). It is read from the fort's wall objects (`walls`,
 * `MapFortificationBuilder`): the inner face of each wall moves the edge on its side
 * (`MapObject.fortWall`, `FORT_WALL_SIDE`). A corner tower and a wall without a role move no edge, so walls without
 * roles give the box round them. `undefined` for no walls.
 */
export const courtBoxOf = (walls: readonly MapObject[]): Rect | undefined => {
  if (walls.length === 0) return undefined;
  const outer = boundsOf(walls.flatMap(({ footprints }) => footprints.flat()));
  let [west, north] = [outer.x, outer.y];
  let [east, south] = [outer.x + outer.width, outer.y + outer.height];
  for (const { fortWall, footprints } of walls) {
    const side = fortWall === undefined ? null : FORT_WALL_SIDE[fortWall];
    const { x, y, width, height } = boundsOf(footprints.flat());
    if (side === 'west') west = Math.max(west, x + width);
    if (side === 'east') east = Math.min(east, x);
    if (side === 'north') north = Math.max(north, y + height);
    if (side === 'south') south = Math.min(south, y);
  }
  return { x: west, y: north, width: east - west, height: south - north };
};
