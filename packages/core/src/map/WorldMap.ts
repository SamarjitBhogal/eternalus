import type { MapDefinition } from '../content/maps/maps.types';
import { isPointInPolygon } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import type { BlockingRule } from './WorldMap.types';

/**
 * The per-match walkability grid derived from a `MapDefinition`. Rift and out-of-bounds terrain
 * and the footprints of blocking features are unwalkable. Footprints can be stamped and cleared
 * later (a wall falls, a tree is felled) without touching the definition. No pathing yet.
 */
export class WorldMap {
  /** Side of one square cell in world units. */
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;
  /** 1 = walkable, 0 = blocked, row-major (`row * cols + col`). */
  public readonly walkable: Uint8Array;
  private readonly terrainWalkable: Uint8Array;
  private readonly stamps: Uint16Array;

  private constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.walkable = new Uint8Array(this.cols * this.rows).fill(1);
    this.terrainWalkable = new Uint8Array(this.cols * this.rows).fill(1);
    this.stamps = new Uint16Array(this.cols * this.rows);
  }

  /**
   * Builds the grid for a map. `cellSize` comes from content (`DEFAULT_MAP_LAYOUT.navCellSize`)
   * until it moves to `GameConfig`; `isBlocking` says which feature definitions block walking.
   */
  public static fromDefinition(
    map: MapDefinition,
    cellSize: number,
    isBlocking: BlockingRule,
  ): WorldMap {
    const grid = new WorldMap(map.width, map.height, cellSize);
    for (const piece of map.terrain) {
      for (const cell of grid.cellsInside(piece.shape)) {
        grid.terrainWalkable[cell] = 0;
        grid.walkable[cell] = 0;
      }
    }
    for (const feature of map.features) {
      if (feature.footprint !== undefined && isBlocking(feature.definitionId)) {
        grid.stampFootprint(feature.footprint);
      }
    }
    return grid;
  }

  /** Whether the cell at `col`, `row` can be walked on; cells outside the grid cannot. */
  public isWalkable(col: number, row: number): boolean {
    const isOnGrid = col >= 0 && row >= 0 && col < this.cols && row < this.rows;
    return isOnGrid && this.walkable[row * this.cols + col] === 1;
  }

  /** The cell under a world position, or `null` outside the world. */
  public cellAt(point: Vec2): { readonly col: number; readonly row: number } | null {
    const col = Math.floor(point.x / this.cellSize);
    const row = Math.floor(point.y / this.cellSize);
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows ? { col, row } : null;
  }

  /** Blocks every cell whose centre lies inside `footprint`. Returns the cells that changed. */
  public stampFootprint(footprint: Polygon): readonly number[] {
    return this.cellsInside(footprint).filter((cell) => {
      this.stamps[cell] = (this.stamps[cell] ?? 0) + 1;
      return this.refresh(cell);
    });
  }

  /** Undoes one `stampFootprint` of the same polygon. Returns the cells that changed. */
  public clearFootprint(footprint: Polygon): readonly number[] {
    return this.cellsInside(footprint).filter((cell) => {
      this.stamps[cell] = Math.max((this.stamps[cell] ?? 0) - 1, 0);
      return this.refresh(cell);
    });
  }

  /** Recomputes one cell; returns whether its walkability changed. */
  private refresh(cell: number): boolean {
    const next = this.terrainWalkable[cell] === 1 && this.stamps[cell] === 0 ? 1 : 0;
    const hasChanged = this.walkable[cell] !== next;
    this.walkable[cell] = next;
    return hasChanged;
  }

  /** Indices of the cells whose centres lie inside `polygon`. */
  private cellsInside(polygon: Polygon): number[] {
    const xs = polygon.map((point) => point.x);
    const ys = polygon.map((point) => point.y);
    const firstCol = Math.max(Math.floor(Math.min(...xs) / this.cellSize), 0);
    const lastCol = Math.min(Math.floor(Math.max(...xs) / this.cellSize), this.cols - 1);
    const firstRow = Math.max(Math.floor(Math.min(...ys) / this.cellSize), 0);
    const lastRow = Math.min(Math.floor(Math.max(...ys) / this.cellSize), this.rows - 1);
    const cells: number[] = [];
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let col = firstCol; col <= lastCol; col += 1) {
        const centre = { x: (col + 0.5) * this.cellSize, y: (row + 0.5) * this.cellSize };
        if (isPointInPolygon(centre, polygon)) {
          cells.push(row * this.cols + col);
        }
      }
    }
    return cells;
  }
}
