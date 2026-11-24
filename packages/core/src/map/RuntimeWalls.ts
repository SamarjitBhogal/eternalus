import type { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import { boundsOf, doPolygonsOverlap } from '../utils/geometry';
import type { Polygon, Rect } from '../utils/geometry.types';
import type { WorldMap } from './WorldMap';

/**
 * The walls a match adds after it is built (architecture 10 §5, 07 §10; a Shield Wall,
 * DEC-330 (7)): one place that makes a body's outline block and stop blocking, with `add` and
 * `remove` doing the same three things in opposite directions. `add` puts the outline into the
 * match's one static collision index (so walking, dashes and shots stop at it, as at a map wall),
 * stamps it on the nav grid (so A\* for Legends routes around it) and reports the cells that
 * changed (so the lane fields over them are rebuilt); `remove` takes it out of the index, clears
 * the same stamps and reports those cells. Stamps are counted (`WorldMap`), so clearing one never
 * opens a cell another wall still covers. The state reads it through the `PlacedWalls` port.
 * Built-in map objects keep their own removal path (`Simulation`, `DefaultSystemPipeline`).
 */
export class RuntimeWalls {
  /** The polygons of each body `add` made a wall, until `remove`. */
  private readonly placed = new Map<string, readonly Polygon[]>();

  /**
   * @param index - The match's one static collision index (`staticCollisionIndexOf`).
   * @param grid - The match's nav grid (`MatchWorld.grid`).
   * @param bounds - The map: an outline must stay inside it.
   * @param onCellsChanged - Told the grid cells whose walkability an `add` or `remove` changed,
   *   when there are any (the lane fields over them go dirty).
   */
  public constructor(
    private readonly index: StaticCollisionIndex,
    private readonly grid: WorldMap,
    private readonly bounds: Rect,
    private readonly onCellsChanged: (cells: readonly number[]) => void,
  ) {}

  /** Whether `outline` overlaps any indexed wall or reaches past the map's edge. */
  public isBlocked(outline: Polygon): boolean {
    const { x, y, width, height } = this.bounds;
    if (outline.some((p) => p.x < x || p.y < y || p.x > x + width || p.y > y + height)) return true;
    for (const wall of this.index.query(boundsOf(outline))) {
      if (doPolygonsOverlap(outline, wall.polygon)) return true;
    }
    return false;
  }

  /**
   * Makes the body `id`'s `polygons` block walking and paths.
   *
   * @throws Error when `id` already blocks.
   */
  public add(id: string, polygons: readonly Polygon[]): void {
    if (this.placed.has(id)) throw new Error(`RuntimeWalls: "${id}" already blocks.`);
    this.placed.set(id, polygons);
    for (const polygon of polygons) this.index.add({ id, polygon });
    this.report(polygons.flatMap((polygon) => this.grid.stampFootprint(polygon)));
  }

  /** Undoes `add` of `id`; an id that does not block changes nothing. */
  public remove(id: string): void {
    const polygons = this.placed.get(id);
    if (polygons === undefined) return;
    this.placed.delete(id);
    this.index.remove(id);
    this.report(polygons.flatMap((polygon) => this.grid.clearFootprint(polygon)));
  }

  private report(cells: readonly number[]): void {
    if (cells.length > 0) this.onCellsChanged(cells);
  }
}
