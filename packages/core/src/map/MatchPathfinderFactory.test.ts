import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { MatchPathfinderFactory } from './MatchPathfinderFactory';

describe('MatchPathfinderFactory', () => {
  const { grid, paths } = new MatchPathfinderFactory().create(
    BLOCKED_LANE_MAP,
    createDefaultGameConfig(),
  );

  it('builds a grid that blocks the rift', () => {
    expect(grid.isLineClear(10, 20, 110, 20)).toBe(false);
  });

  it('paths around the rift: the waypoint is a clear first leg that is not the goal', () => {
    const out = { x: 0, y: 0 };

    expect(paths.waypoint({ x: 10, y: 20 }, { x: 110, y: 20 }, out)).toBe(true);
    expect(grid.isLineClear(10, 20, out.x, out.y)).toBe(true);
    expect(out).not.toEqual({ x: 110, y: 20 });
  });

  it('goes straight when nothing is in the way', () => {
    const out = { x: 0, y: 0 };

    expect(paths.waypoint({ x: 10, y: 20 }, { x: 40, y: 20 }, out)).toBe(true);
    expect(out).toEqual({ x: 40, y: 20 });
  });
});
