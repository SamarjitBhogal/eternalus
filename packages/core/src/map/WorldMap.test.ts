import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_CONFIG } from '../content/maps/defaultMapConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import type { MapDefinition } from '../content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { MapGenerator } from './MapGenerator';
import { WorldMap } from './WorldMap';

const isBlocking = (definitionId: string): boolean =>
  MAP_FEATURE_DEFINITIONS[definitionId]?.blocksMovement ?? false;

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

  it('blocks blocking features of a generated map and leaves lanes walkable', () => {
    const map = new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, 7);
    const grid = WorldMap.fromDefinition(map, DEFAULT_MAP_LAYOUT.navCellSize, isBlocking);
    const stronghold = map.features.find((feature) => feature.id === 'light-stronghold');
    const spawner = map.features.find((feature) => feature.kind === 'spawner-tower');
    const capturePoint = map.features.find((feature) => feature.kind === 'capture-point');
    const walkableAt = (x: number, y: number): boolean => {
      const cell = grid.cellAt({ x, y });
      return cell !== null && grid.isWalkable(cell.col, cell.row);
    };

    expect(walkableAt(stronghold?.position.x ?? 0, stronghold?.position.y ?? 0)).toBe(false);
    expect(walkableAt(spawner?.position.x ?? 0, spawner?.position.y ?? 0)).toBe(false);
    // Capture points sit in the rift's bridge gaps, so the lane can cross the rift there.
    expect(walkableAt(capturePoint?.position.x ?? 0, capturePoint?.position.y ?? 0)).toBe(true);
  });
});
