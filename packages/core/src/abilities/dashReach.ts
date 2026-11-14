import type { WorldMap } from '../map/WorldMap';
import type { Vec2 } from '../utils/geometry.types';
import { REACH_SEARCH_STEPS } from './dashReach.constants';

/**
 * How far along `direction` (a unit vector) from `from` a dash of up to `distance` metres may go:
 * all of `distance` when the line is clear or there is no grid (no map), else the last clear
 * point, found by halving `WorldMap.isLineClear`'s `maxDistance`. The one rule `DashEffect` casts
 * with and `Simulation.dashReach` previews with, so an aim overlay never promises a dash through a
 * wall (architecture 05 §3, plan arch call 9).
 */
export function dashReach(
  grid: Pick<WorldMap, 'isLineClear'> | undefined,
  from: Vec2,
  direction: Vec2,
  distance: number,
): number {
  const end = { x: from.x + direction.x * distance, y: from.y + direction.y * distance };
  if (grid === undefined || grid.isLineClear(from.x, from.y, end.x, end.y)) {
    return distance;
  }
  let clear = 0;
  let blocked = distance;
  for (let step = 0; step < REACH_SEARCH_STEPS; step += 1) {
    const middle = (clear + blocked) / 2;
    if (grid.isLineClear(from.x, from.y, end.x, end.y, middle)) {
      clear = middle;
    } else {
      blocked = middle;
    }
  }
  return clear;
}
