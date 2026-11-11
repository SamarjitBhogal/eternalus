import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { Polygon } from '../utils/geometry.types';
import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { AStarPathfinder } from './AStarPathfinder';
import { MapGenerator } from './MapGenerator';
import { WorldMap } from './WorldMap';
import { stampWalledCourt, WALLED_COURT } from './__fixtures__/walledCourt';

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

  it('leads a walker inside a court out through its doorway, not to the open ground behind its wall (DEC-217 (15))', () => {
    const grid = openGrid();
    stampWalledCourt(grid);
    const finder = new AStarPathfinder(grid, { maxExpansions: 10_000, snapCells: 6 });
    const out = { x: 0, y: 0 };
    const { inside } = WALLED_COURT;

    // West of the fort: the open ground behind the west wall is nearer, but the way is east.
    expect(finder.waypoint(inside, { x: 10, y: 20 }, out)).toBe(true);
    expect(out.x).toBeGreaterThan(inside.x);
    // The way out of the court alone, to the nearest open ground through its doorway.
    expect(finder.exitWaypoint(inside, out)).toBe(true);
    expect(out.x).toBeGreaterThan(inside.x);
    let at: { x: number; y: number } = { ...inside };
    for (let step = 0; step < 20 && !grid.isWalkableAt(at.x, at.y); step += 1) {
      finder.exitWaypoint(at, out);
      at = { x: out.x, y: out.y };
    }
    expect(grid.isWalkableAt(at.x, at.y)).toBe(true);
    expect(at.x).toBeGreaterThan(WALLED_COURT.box.x + WALLED_COURT.box.width - 2);
    // On open ground there is no way out to give.
    expect(finder.exitWaypoint({ x: 10, y: 20 }, out)).toBe(false);
  });

  it('keeps the way out of each court cell: a second question from the same cell searches nothing', () => {
    const grid = openGrid();
    stampWalledCourt(grid);
    const finder = new AStarPathfinder(grid, LIMITS);
    const out = { x: 0, y: 0 };
    const { inside } = WALLED_COURT;

    finder.exitWaypoint(inside, out);
    const first = { ...out };
    const farCost = finder.lastCost;
    // Cell (18, 9), beside the doorway: a cheaper search.
    finder.exitWaypoint({ x: 37, y: 19 }, out);
    const nearCost = finder.lastCost;
    finder.exitWaypoint(inside, out);

    expect(nearCost).toBeLessThan(farCost);
    expect(out).toEqual(first);
    // Answered from the exit field: the last search is still the near one.
    expect(finder.lastCost).toBe(nearCost);
  });

  it('searches the way out again once the grid changes (WorldMap.version)', () => {
    const grid = openGrid();
    stampWalledCourt(grid);
    const finder = new AStarPathfinder(grid, LIMITS);
    const out = { x: 0, y: 0 };
    const { inside, walls } = WALLED_COURT;
    expect(finder.exitWaypoint(inside, out)).toBe(true);
    expect(out.x).toBeGreaterThan(inside.x);

    // The west wall falls: open ground is now 2 cells west, not through the east doorway.
    grid.clearFootprint(walls[2]);

    expect(finder.exitWaypoint(inside, out)).toBe(true);
    expect(out.x).toBeLessThan(inside.x);
  });

  it('heads a walker 2 steps from open ground for the open cell when it is in sight, else for the next cell, wherever it stood first', () => {
    const grid = openGrid();
    stampWalledCourt(grid);
    const finder = new AStarPathfinder(grid, LIMITS);
    const out = { x: 0, y: 0 };
    // Cell (18, 8) (x 36..38, y 16..18): its way out is court cell (18, 9), then doorway cell
    // (19, 9), centre (39, 19). From the cell's south-east corner that centre is in sight.
    const corner = { x: 37.9, y: 17.9 };
    const back = { x: 36.5, y: 16.5 };

    expect(finder.exitWaypoint(corner, out)).toBe(true);
    expect(out).toEqual({ x: 39, y: 19 });
    expect(finder.exitWaypoint(back, out)).toBe(true);
    expect(out).toEqual({ x: 37, y: 19 });
    expect(finder.exitWaypoint(corner, out)).toBe(true);
    expect(out).toEqual({ x: 39, y: 19 });
  });

  it('walks into a court to a goal inside it, through its doorway (DEC-185 (A))', () => {
    const grid = openGrid();
    stampWalledCourt(grid);
    const finder = new AStarPathfinder(grid, { maxExpansions: 10_000, snapCells: 0 });
    const out = { x: 0, y: 0 };

    expect(finder.waypoint({ x: 10, y: 20 }, WALLED_COURT.inside, out)).toBe(true);
    // Round the fort to the east doorway: never straight at the west wall.
    expect(out.x === WALLED_COURT.inside.x && out.y === WALLED_COURT.inside.y).toBe(false);
    expect(Math.abs(out.y - 20)).toBeGreaterThan(5);
  });

  it('walks every leg into a court to its goal: from the doorway on, the next cell is court ground (DEC-227 (Q-A))', () => {
    const grid = openGrid();
    stampWalledCourt(grid);
    const finder = new AStarPathfinder(grid, { maxExpansions: 10_000, snapCells: 0 });
    const out = { x: 0, y: 0 };
    const { inside } = WALLED_COURT;

    let at: { x: number; y: number } = { x: 10, y: 20 };
    for (let leg = 0; leg < 40 && (at.x !== inside.x || at.y !== inside.y); leg += 1) {
      expect(finder.waypoint(at, inside, out)).toBe(true);
      at = { x: out.x, y: out.y };
    }
    expect(at).toEqual(inside);
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

  it("with the default config, steps out of a Stronghold's blocked footprint on a generated map without map objects (DEC-227 (Q-A))", () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const grid = WorldMap.fromDefinition(
      map,
      config.map.navCellSize,
      (definitionId) => MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false,
    );
    const finder = new AStarPathfinder(grid, {
      maxExpansions: config.map.pathMaxExpansions,
      snapCells: config.map.pathSnapCells,
    });
    const home = map.features.find(({ id }) => id === 'light-stronghold')?.position ?? {
      x: 0,
      y: 0,
    };
    const out = { x: 0, y: 0 };

    expect(grid.isWalkableAt(home.x, home.y)).toBe(false);
    expect(finder.waypoint(home, { x: home.x + 60, y: home.y }, out)).toBe(true);
  });
});
