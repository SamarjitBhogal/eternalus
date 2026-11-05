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

  it('faces a unit toward the enemy Stronghold at spawn, and a neutral one nowhere (DEC-216 (6))', () => {
    const grid = WorldMap.fromDefinition(TWO_LANE_MAP, 2, () => false);
    const world = new MatchWorld(TWO_LANE_MAP, grid);

    // The Strongholds stand at (10, 30), light, and (190, 30), dark.
    expect(world.startFacing('light', { x: 60, y: 20 })).toEqual({ x: 130, y: 10 });
    expect(world.startFacing('dark', { x: 140, y: 20 })).toEqual({ x: -130, y: 10 });
    expect(world.startFacing('neutral', { x: 100, y: 30 })).toBeUndefined();
  });

  it('gives no start facing on a map without the enemy Stronghold', () => {
    const map = {
      ...TWO_LANE_MAP,
      features: TWO_LANE_MAP.features.filter(({ id }) => id !== 'stronghold-dark'),
    };
    const world = new MatchWorld(
      map,
      WorldMap.fromDefinition(map, 2, () => false),
    );

    expect(world.startFacing('light', { x: 60, y: 20 })).toBeUndefined();
    expect(world.startFacing('dark', { x: 140, y: 20 })).toEqual({ x: -130, y: 10 });
  });
});
