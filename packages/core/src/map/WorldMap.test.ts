import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_CONFIG } from '../content/maps/defaultMapConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import type { MapDefinition } from '../content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { Vec2 } from '../utils/geometry.types';
import { MapGenerator } from './MapGenerator';
import type { MapConfig } from './MapGenerator.types';
import { WorldMap } from './WorldMap';

const isBlocking = (definitionId: string): boolean =>
  MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false;

/** A 100 x 50 map with one rift square and nothing else. */
const SMALL_MAP: MapDefinition = {
  id: 'small',
  displayName: 'Small',
  width: 100,
  height: 50,
  seed: 0,
  lanes: [],
  terrain: [
    {
      id: 'rift-0',
      kind: 'rift',
      shape: [
        { x: 40, y: 0 },
        { x: 60, y: 0 },
        { x: 60, y: 20 },
        { x: 40, y: 20 },
      ],
    },
  ],
  features: [],
};

type Ground = 'map-1' | 'generated';

const generate = (overrides: Partial<MapConfig> = {}, ground: Ground = 'map-1'): MapDefinition => {
  const config: { -readonly [K in keyof MapConfig]: MapConfig[K] } = {
    ...DEFAULT_MAP_CONFIG,
    ...overrides,
  };
  if (ground === 'generated') {
    delete config.presetId;
  }
  return new MapGenerator().generate({ map: config }, 7);
};

const cellIndex = (grid: WorldMap, point: Vec2): number => {
  const cell = grid.cellAt(point);
  return cell === null ? -1 : cell.row * grid.cols + cell.col;
};

const isWalkableAt = (grid: WorldMap, point: Vec2): boolean => {
  const cell = grid.cellAt(point);
  return cell !== null && grid.isWalkable(cell.col, cell.row);
};

/** Three quarters of the way from a gate's Stronghold to the gate: inside the wall ring. */
const insideGate = (map: MapDefinition, gate: Vec2 | undefined): Vec2 => {
  const point = gate ?? { x: 0, y: 0 };
  const stronghold =
    map.features.find(
      (feature) =>
        feature.kind === 'stronghold' &&
        Math.sign(feature.position.x - map.width / 2) === Math.sign(point.x - map.width / 2),
    )?.position ?? point;
  return {
    x: stronghold.x + (point.x - stronghold.x) * 0.75,
    y: stronghold.y + (point.y - stronghold.y) * 0.75,
  };
};

/** Every cell reachable from `start` through walkable cells, moving up, down, left or right. */
const floodFill = (grid: WorldMap, start: Vec2): ReadonlySet<number> => {
  const first = cellIndex(grid, start);
  const seen = new Set<number>(grid.walkable[first] === 1 ? [first] : []);
  const queue = [...seen];
  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    const col = next % grid.cols;
    const row = Math.floor(next / grid.cols);
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const index = (row + dr) * grid.cols + col + dc;
      if (grid.isWalkable(col + dc, row + dr) && !seen.has(index)) {
        seen.add(index);
        queue.push(index);
      }
    }
  }
  return seen;
};

const SQUARE = [
  { x: 0, y: 30 },
  { x: 20, y: 30 },
  { x: 20, y: 50 },
  { x: 0, y: 50 },
];

describe('WorldMap', () => {
  it('sizes the grid from the map and the cell size', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);

    expect(grid.cols).toBe(10);
    expect(grid.rows).toBe(5);
    expect(grid.walkable).toHaveLength(50);
  });

  it('blocks exactly the cells under terrain', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);

    // Cells (4,0), (5,0), (4,1), (5,1) have their centres inside the rift square.
    expect(grid.walkable.reduce((sum, cell) => sum + (cell === 0 ? 1 : 0), 0)).toBe(4);
    expect(grid.isWalkable(4, 0)).toBe(false);
    expect(grid.isWalkable(5, 1)).toBe(false);
    expect(grid.isWalkable(3, 0)).toBe(true);
    expect(grid.isWalkable(4, 2)).toBe(true);
  });

  it('treats cells outside the grid as not walkable', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);

    expect(grid.isWalkable(-1, 0)).toBe(false);
    expect(grid.isWalkable(10, 0)).toBe(false);
  });

  it('stamping a footprint blocks exactly its cells; clearing restores them', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);
    const before = Uint8Array.from(grid.walkable);

    const blocked = grid.stampFootprint(SQUARE);
    expect([...blocked].sort((a, b) => a - b)).toEqual([30, 31, 40, 41]);
    expect(grid.isWalkable(0, 3)).toBe(false);

    const cleared = grid.clearFootprint(SQUARE);
    expect([...cleared].sort((a, b) => a - b)).toEqual([30, 31, 40, 41]);
    expect(grid.walkable).toEqual(before);
  });

  it('blocks every cell a wall thinner than a cell passes through, leaving no gap', () => {
    const open: MapDefinition = { ...SMALL_MAP, terrain: [] };
    const grid = WorldMap.fromDefinition(open, 10, isBlocking);
    // A diagonal wall 2 units thick from the top edge to the bottom edge.
    grid.stampFootprint([
      { x: 30, y: 0 },
      { x: 32, y: 0 },
      { x: 72, y: 50 },
      { x: 70, y: 50 },
    ]);
    const reached = floodFill(grid, { x: 5, y: 45 });

    expect(reached.has(cellIndex(grid, { x: 95, y: 5 }))).toBe(false);
  });

  it('keeps a cell blocked until every overlapping stamp is cleared', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);
    grid.stampFootprint(SQUARE);
    grid.stampFootprint(SQUARE);

    expect(grid.clearFootprint(SQUARE)).toEqual([]);
    expect(grid.isWalkable(0, 3)).toBe(false);
    grid.clearFootprint(SQUARE);
    expect(grid.isWalkable(0, 3)).toBe(true);
  });

  it('never makes terrain walkable by clearing a footprint over it', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);
    const overRift = [
      { x: 40, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 10 },
      { x: 40, y: 10 },
    ];
    grid.stampFootprint(overRift);
    grid.clearFootprint(overRift);

    expect(grid.isWalkable(4, 0)).toBe(false);
  });

  it('finds the cell under a world position', () => {
    const grid = WorldMap.fromDefinition(SMALL_MAP, 10, isBlocking);

    expect(grid.cellAt({ x: 45, y: 12 })).toEqual({ col: 4, row: 1 });
    expect(grid.cellAt({ x: -1, y: 12 })).toBeNull();
  });

  it('blocks the footprints of blocking features on a generated map', () => {
    const map = generate();
    const grid = WorldMap.fromDefinition(map, DEFAULT_MAP_LAYOUT.navCellSize, isBlocking);
    const at = (id: string): Vec2 =>
      map.features.find((feature) => feature.id === id)?.position ?? { x: -1, y: -1 };

    expect(isWalkableAt(grid, at('light-stronghold'))).toBe(false);
    expect(isWalkableAt(grid, at('dark-spawner-tower-lane-0-0'))).toBe(false);
    expect(isWalkableAt(grid, at('light-turret-0'))).toBe(false);
    // Capture points sit in the rift's bridge gaps, so the lane can cross the rift there.
    expect(isWalkableAt(grid, at('capture-point-lane-0'))).toBe(true);
  });

  it.each([
    [1, 'map-1'],
    [3, 'map-1'],
    [5, 'map-1'],
    [7, 'map-1'],
    [3, 'generated'],
    [5, 'generated'],
    [7, 'generated'],
  ] as const)(
    'connects each Stronghold to the enemy one along every lane (%i lanes, %s ground)',
    (numLanes, ground) => {
      const map = generate({ numLanes, campsPerSide: numLanes > 1 ? 6 : 0 }, ground);
      const grid = WorldMap.fromDefinition(map, DEFAULT_MAP_LAYOUT.navCellSize, isBlocking);

      for (const lane of map.lanes) {
        const light = insideGate(map, lane.path[0]);
        const dark = insideGate(map, lane.path.at(-1));
        const reached = floodFill(grid, light);
        expect(reached.has(cellIndex(grid, dark))).toBe(true);
      }
    },
  );

  it('seals the Stronghold when every gate is closed (no gaps in the wall ring)', () => {
    for (const ground of ['map-1', 'generated'] as const) {
      const map = generate({}, ground);
      const grid = WorldMap.fromDefinition(map, DEFAULT_MAP_LAYOUT.navCellSize, isBlocking);
      for (const gate of map.features.filter((feature) => feature.kind === 'gate')) {
        grid.stampFootprint(gate.footprint ?? []);
      }
      const reached = floodFill(grid, insideGate(map, map.lanes[0]?.path[0]));

      expect(reached.has(cellIndex(grid, { x: map.width / 2, y: map.height / 2 }))).toBe(false);
    }
  });
});
