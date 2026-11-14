import type { MapDefinition } from '../content/maps/maps.types';
import { doesPolygonOverlapRect, isPointInAnyPolygon, isPointInPolygon } from '../utils/geometry';
import type { Polygon, Rect, Vec2 } from '../utils/geometry.types';
import { sqrt } from '../utils/deterministicMath';
import { CELL_EDGE_SLACK, LINE_STEP_FRACTION } from './WorldMap.constants';
import type { BlockingRule } from './WorldMap.types';

/**
 * The per-match walkability grid derived from a `MapDefinition`. Every cell touched by rift or
 * out-of-bounds terrain or by the footprint of a blocking feature is unwalkable. Footprints can be stamped and cleared
 * later (a wall falls, a tree is felled) without touching the definition.
 *
 * A court (a lane tower's fort court, DEC-185 (A)) is stamped apart from footprints: its cells
 * are unwalkable like any other, so lane flow fields and straight lines never run through it, but
 * `isCourt` tells A\* a unit may walk them to leave or enter by the doorways (DEC-217 (15)).
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
  /** Per cell, how many stamped footprints hold its centre (`isCourt`). */
  private readonly cores: Uint16Array;
  private readonly courts: Uint16Array;
  private changes = 0;

  private constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.walkable = new Uint8Array(this.cols * this.rows).fill(1);
    this.terrainWalkable = new Uint8Array(this.cols * this.rows).fill(1);
    this.stamps = new Uint16Array(this.cols * this.rows);
    this.cores = new Uint16Array(this.cols * this.rows);
    this.courts = new Uint16Array(this.cols * this.rows);
  }

  /**
   * Builds the grid for a map. `cellSize` is `GameConfig.map.navCellSize`; `isBlocking` says
   * which feature definitions block walking.
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

  /**
   * Whether the cell at `col`, `row` is court ground: inside a court stamp (`stampCourt`) and on
   * walkable terrain, with no footprint over its centre, so a unit in it may walk out by the
   * court's doorways. A wall that only touches the cell leaves it court ground: the conservative
   * raster would otherwise close a court corridor narrower than two cells. Every fort wall is
   * thicker than a cell, so a step across one always lands on a cell whose centre it covers
   * (DEC-227 (Q-A)). Cells outside the grid are not court ground.
   */
  public isCourt(col: number, row: number): boolean {
    const isOnGrid = col >= 0 && row >= 0 && col < this.cols && row < this.rows;
    const cell = row * this.cols + col;
    return (
      isOnGrid &&
      (this.courts[cell] ?? 0) > 0 &&
      this.cores[cell] === 0 &&
      this.terrainWalkable[cell] === 1
    );
  }

  /**
   * Whether the cell under the world position `(x, y)` is court ground (`isCourt`), or blocked
   * ground with court ground among its 8 neighbours (a fort wall's cell beside its court): where a
   * unit leaves by the court's doorways (DEC-217 (15)). Cells outside the grid are neither.
   */
  public isCourtSideAt(x: number, y: number): boolean {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (this.isWalkable(col, row) || this.cellAt({ x, y }) === null) return false;
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      for (let dCol = -1; dCol <= 1; dCol += 1) {
        if (this.isCourt(col + dCol, row + dRow)) return true;
      }
    }
    return false;
  }

  /**
   * Counts the stamps and clears so far: it changes whenever a cell may have changed, so a cache
   * of searches over the grid (`CourtExitField`) knows when to start again.
   */
  public get version(): number {
    return this.changes;
  }

  /** Whether the cell under the world position `(x, y)` can be walked on; outside the grid, no. */
  public isWalkableAt(x: number, y: number): boolean {
    return this.isWalkable(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
  }

  /**
   * Whether the first `maxDistance` of the straight line from `(fromX, fromY)` to `(toX, toY)` is
   * walkable, sampled `LINE_STEP_FRACTION` of a cell apart (flow fields, A\* string pulling).
   *
   * @remarks ponytail: sampling can miss a line that clips a blocked cell's corner for less than a
   * step. An exact cell walk (DDA) catches it, but mobs then hold at rift corners, since they have
   * no wall-avoidance term to slide along them. Switch to the exact walk when `CollisionSystem`
   * brings that term (10 §8–§9); until then no unit collides with blocked ground either.
   */
  public isLineClear(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    maxDistance = Number.POSITIVE_INFINITY,
  ): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const span = sqrt(dx * dx + dy * dy);
    const reach = Math.min(span, maxDistance);
    const stride = this.cellSize * LINE_STEP_FRACTION;
    const steps = Math.ceil(reach / stride);
    for (let step = 1; step <= steps; step += 1) {
      const along = Math.min(step * stride, reach) / span;
      const col = Math.floor((fromX + dx * along) / this.cellSize);
      const row = Math.floor((fromY + dy * along) / this.cellSize);
      if (!this.isWalkable(col, row)) {
        return false;
      }
    }
    return true;
  }

  /**
   * How far the blocked ground under `(fromX, fromY)` reaches toward `(towardX, towardY)`: the
   * distance to the first walkable point of the straight line, sampled as `isLineClear` samples.
   * 0 when `from` is walkable; the whole span when nothing walkable lies between.
   */
  public blockedRun(fromX: number, fromY: number, towardX: number, towardY: number): number {
    const dx = towardX - fromX;
    const dy = towardY - fromY;
    const span = sqrt(dx * dx + dy * dy);
    const stride = this.cellSize * LINE_STEP_FRACTION;
    const steps = Math.ceil(span / stride);
    for (let step = 0; step <= steps; step += 1) {
      const along = Math.min(step * stride, span);
      const t = span === 0 ? 0 : along / span;
      if (this.isWalkableAt(fromX + dx * t, fromY + dy * t)) {
        return along;
      }
    }
    return span;
  }

  /** The cell under a world position, or `null` outside the world. */
  public cellAt(point: Vec2): { readonly col: number; readonly row: number } | null {
    const col = Math.floor(point.x / this.cellSize);
    const row = Math.floor(point.y / this.cellSize);
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows ? { col, row } : null;
  }

  /**
   * Blocks every cell `footprint` covers any part of, except cells wholly inside one of
   * `openings` (a bridge deck over a lava river). Returns the cells that changed.
   */
  public stampFootprint(footprint: Polygon, openings: readonly Polygon[] = []): readonly number[] {
    return this.restamp(footprint, openings, 1);
  }

  /** Undoes one `stampFootprint` of the same polygon and openings. Returns the cells that changed. */
  public clearFootprint(footprint: Polygon, openings: readonly Polygon[] = []): readonly number[] {
    return this.restamp(footprint, openings, -1);
  }

  /**
   * Blocks every cell `court` covers any part of as court ground (`isCourt`): closed to walking
   * and lines like a footprint, but not a wall. Returns the cells that changed.
   */
  public stampCourt(court: Polygon): readonly number[] {
    return this.recourt(court, 1);
  }

  /** Undoes one `stampCourt` of the same polygon. Returns the cells that changed. */
  public clearCourt(court: Polygon): readonly number[] {
    return this.recourt(court, -1);
  }

  /** Adds `delta` to the court count of every cell `court` covers. Returns the cells that changed. */
  private recourt(court: Polygon, delta: 1 | -1): number[] {
    this.changes += 1;
    return this.cellsInside(court).filter((cell) => {
      this.courts[cell] = Math.max((this.courts[cell] ?? 0) + delta, 0);
      return this.refresh(cell);
    });
  }

  /**
   * Adds `delta` to the stamp count of every cell `footprint` covers, and to the core count of
   * those whose centre it holds outside `openings`. Returns the cells whose walkability changed.
   */
  private restamp(footprint: Polygon, openings: readonly Polygon[], delta: 1 | -1): number[] {
    this.changes += 1;
    const half = this.cellSize / 2;
    return this.cellsInside(footprint, openings).filter((cell) => {
      this.stamps[cell] = Math.max((this.stamps[cell] ?? 0) + delta, 0);
      const col = cell % this.cols;
      const centre = {
        x: col * this.cellSize + half,
        y: ((cell - col) / this.cols) * this.cellSize + half,
      };
      if (isPointInPolygon(centre, footprint) && !isPointInAnyPolygon(centre, openings)) {
        this.cores[cell] = Math.max((this.cores[cell] ?? 0) + delta, 0);
      }
      return this.refresh(cell);
    });
  }

  /** Recomputes one cell; returns whether its walkability changed. */
  private refresh(cell: number): boolean {
    const isOpen =
      this.terrainWalkable[cell] === 1 && this.stamps[cell] === 0 && this.courts[cell] === 0;
    const next = isOpen ? 1 : 0;
    const hasChanged = this.walkable[cell] !== next;
    this.walkable[cell] = next;
    return hasChanged;
  }

  /**
   * Indices of every cell the polygon covers any part of (conservative), so a wall thinner than
   * a cell still blocks every cell it passes through and leaves no gap to slip through.
   */
  private cellsInside(polygon: Polygon, openings: readonly Polygon[] = []): number[] {
    const xs = polygon.map((point) => point.x);
    const ys = polygon.map((point) => point.y);
    const firstCol = Math.max(Math.floor(Math.min(...xs) / this.cellSize), 0);
    const lastCol = Math.min(Math.floor(Math.max(...xs) / this.cellSize), this.cols - 1);
    const firstRow = Math.max(Math.floor(Math.min(...ys) / this.cellSize), 0);
    const lastRow = Math.min(Math.floor(Math.max(...ys) / this.cellSize), this.rows - 1);
    const cells: number[] = [];
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let col = firstCol; col <= lastCol; col += 1) {
        // Shrunk by a hair so a shape that only touches a cell's edge does not claim it.
        const cell = {
          x: col * this.cellSize + this.cellSize * CELL_EDGE_SLACK,
          y: row * this.cellSize + this.cellSize * CELL_EDGE_SLACK,
          width: this.cellSize * (1 - 2 * CELL_EDGE_SLACK),
          height: this.cellSize * (1 - 2 * CELL_EDGE_SLACK),
        };
        if (doesPolygonOverlapRect(polygon, cell) && !WorldMap.isInsideAny(cell, openings)) {
          cells.push(row * this.cols + col);
        }
      }
    }
    return cells;
  }

  /** Whether every corner of `cell` lies inside one of `openings` (convex openings only). */
  private static isInsideAny(cell: Rect, openings: readonly Polygon[]): boolean {
    const corners = [
      { x: cell.x, y: cell.y },
      { x: cell.x + cell.width, y: cell.y },
      { x: cell.x + cell.width, y: cell.y + cell.height },
      { x: cell.x, y: cell.y + cell.height },
    ];
    return openings.some((opening) => corners.every((corner) => isPointInPolygon(corner, opening)));
  }
}
