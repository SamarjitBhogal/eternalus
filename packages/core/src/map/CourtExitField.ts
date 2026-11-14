import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { UNSEARCHED } from './CourtExitField.constants';
import type { ExitSearch, ExitWay } from './CourtExitField.types';
import type { WorldMap } from './WorldMap';

/**
 * The way out of a court for each blocked cell (DEC-217 (15)), searched on demand and kept until
 * the grid changes (`WorldMap.version`), so a crowd in a court costs one search per cell, not one
 * per unit per tick (DEC-235 (B1)). The search itself is `AStarPathfinder`'s.
 *
 * Keeping the answer is exact: from blocked ground the only line that can be clear is the one to
 * the way's open cell, so all but a 2-step way give the same answer anywhere in the cell, and for
 * a 2-step way the field keeps the open cell and checks that one line.
 */
export class CourtExitField {
  /** Per cell, the next cell of its way out; `UNSEARCHED`, or -1 for none. */
  private readonly next: Int32Array;
  /** Per cell, the way out's open cell when it is 2 steps away, else the same as `next`. */
  private readonly end: Int32Array;
  /** The `WorldMap.version` the field was filled for. */
  private version = -1;
  private readonly way: ExitWay = { next: -1, end: -1 };

  /**
   * @param grid - The walkability grid the ways run over.
   * @param search - Finds the way out of one blocked cell.
   */
  public constructor(
    private readonly grid: WorldMap,
    private readonly search: ExitSearch,
  ) {
    const cells = grid.cols * grid.rows;
    this.next = new Int32Array(cells);
    this.end = new Int32Array(cells);
  }

  /**
   * Writes into `out` where a walker on blocked ground at `start` heads next to leave it: the
   * centre of the way's open cell when it is 2 steps away and in sight, else of the way's next
   * cell. Returns `false`, leaving `out` as it was, on open ground or when there is no way.
   */
  public waypoint(start: Vec2, out: MutableVec2): boolean {
    const cell = this.grid.cellAt(start);
    if (cell === null || this.grid.isWalkable(cell.col, cell.row)) {
      return false;
    }
    if (this.version !== this.grid.version) {
      this.next.fill(UNSEARCHED);
      this.version = this.grid.version;
    }
    const index = cell.row * this.grid.cols + cell.col;
    if (this.next[index] === UNSEARCHED) {
      this.search(index, this.way);
      this.next[index] = this.way.next;
      this.end[index] = this.way.end;
    }
    const next = this.next[index] ?? -1;
    const end = this.end[index] ?? -1;
    if (next === -1) {
      return false;
    }
    this.centreOf(end, out);
    if (end !== next && !this.grid.isLineClear(start.x, start.y, out.x, out.y)) {
      this.centreOf(next, out);
    }
    return true;
  }

  /** Writes the centre of `cell` into `out`. */
  private centreOf(cell: number, out: MutableVec2): void {
    const { cols, cellSize } = this.grid;
    const col = cell % cols;
    out.x = (col + 0.5) * cellSize;
    out.y = ((cell - col) / cols + 0.5) * cellSize;
  }
}
