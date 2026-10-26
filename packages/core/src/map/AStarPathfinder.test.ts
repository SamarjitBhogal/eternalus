import { describe, expect, it } from 'vitest';

import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { AStarPathfinder } from './AStarPathfinder';
import { WorldMap } from './WorldMap';

/** The blocked-lane map on 2 m cells: a rift fills x 50..70, y 10..30. */
const grid = () => WorldMap.fromDefinition(BLOCKED_LANE_MAP, 2, () => false);

describe('AStarPathfinder (A* for Legends, 10 §9)', () => {
  it('answers the goal itself when the straight line to it is clear, without searching', () => {
    const out = { x: 0, y: 0 };

    expect(new AStarPathfinder(grid(), 0).waypoint({ x: 10, y: 20 }, { x: 40, y: 20 }, out)).toBe(
      true,
    );
    expect(out).toEqual({ x: 40, y: 20 });
  });

  it('leads around the rift: a visible waypoint past its corner, never into it', () => {
    const map = grid();
    const out = { x: 0, y: 0 };

    expect(new AStarPathfinder(map, 10_000).waypoint({ x: 40, y: 20 }, { x: 80, y: 20 }, out)).toBe(
      true,
    );
    expect(out.y < 10 || out.y > 30).toBe(true);
    expect(map.isLineClear(40, 20, out.x, out.y)).toBe(true);
    expect(out.x).toBeGreaterThan(40);
  });

  it('gives the same waypoint every time for the same question', () => {
    const finder = new AStarPathfinder(grid(), 10_000);
    const first = { x: 0, y: 0 };
    const second = { x: 0, y: 0 };

    finder.waypoint({ x: 40, y: 20 }, { x: 80, y: 20 }, first);
    finder.waypoint({ x: 40, y: 22 }, { x: 80, y: 18 }, { x: 0, y: 0 });
    finder.waypoint({ x: 40, y: 20 }, { x: 80, y: 20 }, second);

    expect(second).toEqual(first);
  });

  it('finds no way to a blocked goal, off the map, or past its search budget', () => {
    const finder = new AStarPathfinder(grid(), 10_000);
    const out = { x: 0, y: 0 };

    expect(finder.waypoint({ x: 40, y: 20 }, { x: 60, y: 20 }, out)).toBe(false);
    expect(finder.waypoint({ x: 40, y: 20 }, { x: 500, y: 20 }, out)).toBe(false);
    expect(new AStarPathfinder(grid(), 5).waypoint({ x: 40, y: 20 }, { x: 80, y: 20 }, out)).toBe(
      false,
    );
  });
});
