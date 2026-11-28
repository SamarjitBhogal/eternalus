import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';
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

  it('stamps a lane tower inside its fort as court ground, as the match does (DEC-217 (15))', () => {
    const box = (from: number, to: number): Polygon => [
      { x: from, y: from },
      { x: to, y: from },
      { x: to, y: to },
      { x: from, y: to },
    ];
    const map: MapDefinition = {
      ...BLOCKED_LANE_MAP,
      width: 1600,
      height: 900,
      terrain: [],
      features: [
        {
          id: 'tower',
          kind: 'spawner-tower',
          team: 'neutral',
          definitionId: 'spawner-tower',
          position: { x: 230, y: 230 },
          minimapGlyph: { shape: 'dot', size: 1, colourRole: 'team' },
          footprint: box(200, 260),
        },
      ],
    };
    const config = createDefaultGameConfig();
    const fort = {
      id: 'tower',
      kind: 'wall' as const,
      isBlocking: true,
      footprints: [box(220, 240)],
    };

    const navigation = new MatchPathfinderFactory().create(map, config, [fort]);

    const cell = Math.floor(205 / config.map.navCellSize);
    expect(navigation.grid).toBe(navigation.matchGrid.grid);
    expect(navigation.grid.isWalkableAt(205, 205)).toBe(false);
    expect(navigation.grid.isCourt(cell, cell)).toBe(true);
  });
});
