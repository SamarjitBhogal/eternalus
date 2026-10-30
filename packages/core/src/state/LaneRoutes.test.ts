import { describe, expect, it } from 'vitest';

import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { LaneRoutes } from './LaneRoutes';

describe('LaneRoutes', () => {
  const routes = new LaneRoutes(TWO_LANE_MAP);

  it('lists lanes by index and measures them', () => {
    expect(routes.lanes.map((lane) => lane.id)).toEqual(['lane-0', 'lane-1']);
    expect(routes.length('lane-0')).toBe(160);
    expect(() => routes.length('lane-9')).toThrow('no lane "lane-9"');
  });

  it('measures a point from each team’s own gate', () => {
    expect(routes.distanceAlong('lane-0', 'light', { x: 60, y: 25 })).toBe(40);
    expect(routes.distanceAlong('lane-0', 'dark', { x: 60, y: 25 })).toBe(120);
    expect(routes.distanceAlong('lane-0', 'light', { x: 0, y: 30 })).toBe(0);
    expect(routes.distanceAlong('lane-0', 'light', { x: 999, y: 20 })).toBe(160);
  });

  it('finds the lane nearest a point, the lower index on a tie', () => {
    expect(routes.nearestLane({ x: 90, y: 22 })?.id).toBe('lane-0');
    expect(routes.nearestLane({ x: 90, y: 38 })?.id).toBe('lane-1');
    expect(routes.nearestLane({ x: 90, y: 30 })?.id).toBe('lane-0');
  });

  it('gives the point and walking direction at a distance, clamped to the lane', () => {
    const point = { x: 0, y: 0 };
    const forward = { x: 0, y: 0 };

    routes.pose('lane-0', 'light', 120, point, forward);
    expect({ point, forward }).toEqual({ point: { x: 140, y: 20 }, forward: { x: 1, y: 0 } });

    routes.pose('lane-0', 'dark', 30, point, forward);
    expect({ point, forward }).toEqual({ point: { x: 150, y: 20 }, forward: { x: -1, y: 0 } });

    routes.pose('lane-1', 'light', 500, point, forward);
    expect(point).toEqual({ x: 180, y: 40 });
  });
});
