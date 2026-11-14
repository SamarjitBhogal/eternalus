import { describe, expect, it } from 'vitest';

import { WorldMap } from '../map/WorldMap';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { MatchWorld } from './MatchWorld';

describe('MatchWorld', () => {
  it('walks the lanes of its definition and keeps the grid it was given', () => {
    const grid = WorldMap.fromDefinition(TWO_LANE_MAP, 2, () => false);

    const world = new MatchWorld(TWO_LANE_MAP, grid);

    expect(world.definition).toBe(TWO_LANE_MAP);
    expect(world.grid).toBe(grid);
    expect(world.routes.lanes.map((lane) => lane.id)).toEqual(['lane-0', 'lane-1']);
    expect(world.routes.length('lane-0')).toBe(160);
  });
});
