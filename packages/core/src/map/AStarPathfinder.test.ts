import { describe, expect, it } from 'vitest';

import type { Polygon } from '../utils/geometry.types';
import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { AStarPathfinder } from './AStarPathfinder';
import { WorldMap } from './WorldMap';

/** An open 120 x 40 map on 2 m cells: the blocked-lane map without its rift. */
const openGrid = () =>
  WorldMap.fromDefinition({ ...BLOCKED_LANE_MAP, terrain: [] }, 2, () => false);
/** The blocked-lane map on 2 m cells: a rift fills x 50..70, y 10..30. */
const riftGrid = () => WorldMap.fromDefinition(BLOCKED_LANE_MAP, 2, () => false);
const LIMITS = { maxExpansions: 10_000, snapCells: 0 };
/** A wall across y 20 from x 50 to 54, reaching 14 m up but only 6 m down: below is shorter. */
const OFF_CENTRE_WALL: Polygon = [
  { x: 50, y: 6 },
  { x: 54, y: 6 },
  { x: 54, y: 26 },
  { x: 50, y: 26 },
];

describe('AStarPathfinder (A* for Legends, 10 §9)', () => {
  it('answers the goal itself when the straight line to it is clear, without searching', () => {
    const out = { x: 0, y: 0 };

    expect(
      new AStarPathfinder(openGrid(), { maxExpansions: 0, snapCells: 0 }).waypoint(
        { x: 10, y: 20 },
        { x: 40, y: 20 },
        out,
      ),
    ).toBe(true);
    expect(out).toEqual({ x: 40, y: 20 });
  });

  it('takes the shorter side of a stamped footprint, and goes straight again once it is cleared', () => {
    const grid = openGrid();
    grid.stampFootprint(OFF_CENTRE_WALL);
    const finder = new AStarPathfinder(grid, LIMITS);
    const out = { x: 0, y: 0 };

    expect(finder.waypoint({ x: 30, y: 20 }, { x: 74, y: 20 }, out)).toBe(true);
    // The first corner to round is the wall's lower end (y 26), not its upper one (y 6).
    expect(out.y).toBeGreaterThan(26);
    expect(grid.isLineClear(30, 20, out.x, out.y)).toBe(true);

    grid.clearFootprint(OFF_CENTRE_WALL);
    expect(finder.waypoint({ x: 30, y: 20 }, { x: 74, y: 20 }, out)).toBe(true);
    expect(out).toEqual({ x: 74, y: 20 });
  });

  it('finds the optimal octile path: its cost is the hand-computed shortest', () => {
    const grid = openGrid();
    grid.stampFootprint(OFF_CENTRE_WALL);
    const finder = new AStarPathfinder(grid, LIMITS);

    finder.waypoint({ x: 31, y: 21 }, { x: 73, y: 21 }, { x: 0, y: 0 });

    // Cells (15, 10) to (36, 10) around a wall over columns 25..26, rows 3..12: 21 columns and
    // 3 rows down, then 3 back up: 6 diagonals (14) and 15 straights (10).
    expect(finder.lastCost).toBe(6 * 14 + 15 * 10);
  });

  it('gives the same waypoint every time for the same question', () => {
    const finder = new AStarPathfinder(riftGrid(), LIMITS);
    const first = { x: 0, y: 0 };
    const second = { x: 0, y: 0 };

    finder.waypoint({ x: 40, y: 20 }, { x: 80, y: 20 }, first);
    finder.waypoint({ x: 40, y: 22 }, { x: 80, y: 18 }, { x: 0, y: 0 });
    finder.waypoint({ x: 40, y: 20 }, { x: 80, y: 20 }, second);

    expect(second).toEqual(first);
  });

  it('steps out of blocked ground and reaches a blocked goal’s edge within its snap distance', () => {
    const finder = new AStarPathfinder(riftGrid(), { maxExpansions: 10_000, snapCells: 6 });
    const out = { x: 0, y: 0 };

    // From inside the rift: its first move is to the nearest open cell, out of the rift.
    expect(finder.waypoint({ x: 52, y: 20 }, { x: 90, y: 20 }, out)).toBe(true);
    expect(out.x < 50 || out.y < 10 || out.y > 30).toBe(true);
    // Toward the rift's middle: a way to its nearest open edge.
    expect(finder.waypoint({ x: 40, y: 20 }, { x: 60, y: 28 }, out)).toBe(true);
  });

  it('finds no way to a blocked goal without snapping, off the map, or past its budget', () => {
    const finder = new AStarPathfinder(riftGrid(), LIMITS);
    const out = { x: 0, y: 0 };

    expect(finder.waypoint({ x: 40, y: 20 }, { x: 60, y: 20 }, out)).toBe(false);
    expect(finder.waypoint({ x: 40, y: 20 }, { x: 500, y: 20 }, out)).toBe(false);
    expect(
      new AStarPathfinder(riftGrid(), { maxExpansions: 5, snapCells: 0 }).waypoint(
        { x: 40, y: 20 },
        { x: 80, y: 20 },
        out,
      ),
    ).toBe(false);
  });
});
