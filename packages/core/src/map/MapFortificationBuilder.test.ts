import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapFeature } from '../content/maps/maps.types';
import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { MapFortificationBuilder } from './MapFortificationBuilder';
import { WorldMap } from './WorldMap';

/** The width, in nav cells, every way through a lane tower's court must have (DEC-315). */
const PASSAGE_CELLS = 2;

/** A light SpawnerTower at `(x, y)`, as the generator places one. */
const tower = (x: number, y: number): MapFeature => ({
  id: 'light-spawner-tower-lane-1-0',
  kind: 'spawner-tower',
  team: 'light',
  definitionId: 'spawner-tower',
  position: { x, y },
  minimapGlyph: { shape: 'square', size: 5, colourRole: 'team' },
  laneId: 'lane-1',
});

/**
 * Whether a square of `PASSAGE_CELLS` x `PASSAGE_CELLS` walkable cells can slide, a cell at a
 * time, from the open ground west of `box` to the open ground east of it while it stays within
 * the box's rows: a way through the fort by its west and east doorways at least that wide, on the
 * conservative raster (every cell a wall or the keep touches is blocked).
 */
const hasWideWayAcross = (
  grid: WorldMap,
  box: { left: number; right: number; top: number; bottom: number },
): boolean => {
  const size = grid.cellSize;
  const firstCol = Math.floor(box.left / size) - PASSAGE_CELLS - 1;
  const lastCol = Math.floor(box.right / size) + 1;
  const firstRow = Math.floor(box.top / size);
  const lastRow = Math.floor(box.bottom / size) - PASSAGE_CELLS + 1;
  const isFree = (col: number, row: number): boolean => {
    for (let dRow = 0; dRow < PASSAGE_CELLS; dRow += 1) {
      for (let dCol = 0; dCol < PASSAGE_CELLS; dCol += 1) {
        if (!grid.isWalkable(col + dCol, row + dRow)) return false;
      }
    }
    return true;
  };
  const seen = new Set<number>();
  const queue: [number, number][] = [];
  for (let row = firstRow; row <= lastRow; row += 1) {
    if (isFree(firstCol, row)) {
      queue.push([firstCol, row]);
      seen.add(row * grid.cols + firstCol);
    }
  }
  while (queue.length > 0) {
    const [col, row] = queue.shift() ?? [0, 0];
    if (col === lastCol) return true;
    for (const [dCol, dRow] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const next: [number, number] = [col + dCol, row + dRow];
      const key = next[1] * grid.cols + next[0];
      const isInside =
        next[0] >= firstCol && next[0] <= lastCol && next[1] >= firstRow && next[1] <= lastRow;
      if (isInside && !seen.has(key) && isFree(next[0], next[1])) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return false;
};

describe('MapFortificationBuilder', () => {
  it('leaves a way through a lane tower fort, west doorway to east doorway, 2 nav cells wide at every grid alignment (DEC-315)', () => {
    const { navCellSize } = createDefaultGameConfig().map;
    const half = G.fort.laneTowerSize / 2;
    const steps = 5;
    const narrow: string[] = [];
    for (let i = 0; i < steps; i += 1) {
      for (let j = 0; j < steps; j += 1) {
        const x = 100 + (i * navCellSize) / steps;
        const y = 100 + (j * navCellSize) / steps;
        // Sketch units are world metres at the default world (1600 x 900, `fortInWorld`).
        const pieces = new MapFortificationBuilder().build(tower(x, y));
        const grid = WorldMap.fromDefinition(
          { ...BLOCKED_LANE_MAP, width: 200, height: 200, terrain: [], features: [] },
          navCellSize,
          () => false,
        );
        for (const piece of pieces) {
          if (piece.object?.isFootprint === true) grid.stampFootprint(piece.shape);
        }
        const box = { left: x - half, right: x + half, top: y - half, bottom: y + half };
        if (!hasWideWayAcross(grid, box)) narrow.push(`(${x.toFixed(1)}, ${y.toFixed(1)})`);
      }
    }

    expect(narrow).toEqual([]);
  });
});
