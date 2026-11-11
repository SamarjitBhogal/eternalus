import { describe, expect, it } from 'vitest';

import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { MapObject } from '../content/maps/mapObjects.types';
import { MatchGrid } from '../map/MatchGrid';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { MatchWorld } from './MatchWorld';

describe('MatchWorld', () => {
  it('walks the lanes of its definition and keeps the grid it was given', () => {
    const stamps = MatchGrid.build(TWO_LANE_MAP, [], { cellSize: 2, features: {} });
    const world = new MatchWorld(TWO_LANE_MAP, stamps);

    expect(world.definition).toBe(TWO_LANE_MAP);
    expect(world.grid).toBe(stamps.grid);
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
      TWO_LANE_MAP,
      MatchGrid.build(TWO_LANE_MAP, [rock], { cellSize: 2, features: MAP_FEATURE_DEFINITIONS }),
    );
    expect(world.grid.isWalkableAt(42, 20)).toBe(false);

    expect(world.reopen(rock).length).toBeGreaterThan(0);
    expect(world.grid.isWalkableAt(42, 20)).toBe(true);
  });
});
