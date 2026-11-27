import { describe, expect, it } from 'vitest';

import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { MatchGrid } from '../map/MatchGrid';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { MatchWorld } from './MatchWorld';

describe('MatchWorld', () => {
  it('walks the lanes of its definition and keeps the grid it was given', () => {
    const matchGrid = MatchGrid.build(TWO_LANE_MAP, [], { cellSize: 2, features: {} });
    const world = new MatchWorld(matchGrid);

    expect(world.definition).toBe(TWO_LANE_MAP);
    expect(world.grid).toBe(matchGrid.grid);
    expect(world.grid.cellSize).toBe(2);
    expect(world.routes.lanes.map((lane) => lane.id)).toEqual(['lane-0', 'lane-1']);
    expect(world.routes.length('lane-0')).toBe(160);
  });

  it('reopens a destroyed object through the rule that stamped it', () => {
    const rock: MapObject = {
      id: 'rock',
      kind: 'rock',
      isBlocking: true,
      footprints: [
        [
          { x: 40, y: 18 },
          { x: 44, y: 18 },
          { x: 44, y: 22 },
          { x: 40, y: 22 },
        ],
      ],
    };
    const world = new MatchWorld(
      MatchGrid.build(TWO_LANE_MAP, [rock], { cellSize: 2, features: MAP_FEATURE_DEFINITIONS }),
    );
    expect(world.grid.isWalkableAt(42, 20)).toBe(false);

    expect(world.reopen(rock).length).toBeGreaterThan(0);
    expect(world.grid.isWalkableAt(42, 20)).toBe(true);
  });

  it('finds the Stronghold of each team, as a copy', () => {
    const grid = (map: typeof TWO_LANE_MAP) =>
      MatchGrid.build(map, [], { cellSize: 2, features: {} });
    const world = new MatchWorld(grid(TWO_LANE_MAP));

    expect(world.strongholdOf('light')).toEqual({ x: 10, y: 30 });
    expect(world.strongholdOf('dark')).toEqual({ x: 190, y: 30 });
    expect(world.strongholdOf('light')).not.toBe(world.strongholdOf('light'));
    const noFeatures = { ...TWO_LANE_MAP, features: [] };
    expect(new MatchWorld(grid(noFeatures)).strongholdOf('light')).toBeUndefined();
  });

  it('faces a unit toward the enemy Stronghold at spawn, and a neutral one nowhere (DEC-216 (6))', () => {
    const matchGrid = MatchGrid.build(TWO_LANE_MAP, [], { cellSize: 2, features: {} });
    const world = new MatchWorld(matchGrid);

    // The Strongholds stand at (10, 30), light, and (190, 30), dark.
    expect(world.startFacing('light', { x: 60, y: 20 })).toEqual({ facing: { x: 130, y: 10 } });
    expect(world.startFacing('dark', { x: 140, y: 20 })).toEqual({ facing: { x: -130, y: 10 } });
    expect(world.startFacing('neutral', { x: 100, y: 30 })).toEqual({});
  });

  it('gives no start facing on a map without the enemy Stronghold', () => {
    const map = {
      ...TWO_LANE_MAP,
      features: TWO_LANE_MAP.features.filter(({ id }) => id !== 'stronghold-dark'),
    };
    const world = new MatchWorld(MatchGrid.build(map, [], { cellSize: 2, features: {} }));

    expect(world.startFacing('light', { x: 60, y: 20 })).toEqual({});
    expect(world.startFacing('dark', { x: 140, y: 20 })).toEqual({ facing: { x: -130, y: 10 } });
  });
});
