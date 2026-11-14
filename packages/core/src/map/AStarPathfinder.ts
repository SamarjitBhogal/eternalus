import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { AStarLimits } from './AStarPathfinder.types';
import { CellHeap } from './CellHeap';
import { CourtExitField } from './CourtExitField';
import type { ExitWay } from './CourtExitField.types';
import {
  DIAGONAL_COST,
  DIRECTION_COLS,
  DIRECTION_ROWS,
  STRAIGHT_COST,
} from './FlowField.constants';
import type { WorldMap } from './WorldMap';

/**
 * A\* for Legends (architecture 10 §9): finds where a bot should head next to reach a point.
 * Eight neighbours with octile costs and no corner cutting, an octile heuristic, ties by cell
 * index; then string pulling, so the answer is the farthest cell of the path the bot can walk to
 * in a straight line. When the straight line to the goal is already clear it answers the goal
 * without searching. A start or goal on blocked ground (inside a footprint) moves to the nearest
 * open cell within `snapCells`. A search stops after `maxExpansions` cells and answers "no way"
 * rather than flood the whole grid. Allocation-free after construction: a search stamps the cells
 * it touches instead of clearing whole-grid buffers.
 *
 * Court cells (`WorldMap.isCourt`: a lane tower's fort court) are open to a search, so a way from
 * or to a unit inside a court runs through its doorways, never through its walls (DEC-185 (A),
 * DEC-217 (15)); `exitWaypoint` gives the way out of a court alone, kept per cell until the grid
 * changes (`CourtExitField`). Lane flow fields still treat a court as blocked, so hordes never
 * march through one.
 *
 * @remarks ponytail: a bot searches again on each decision whose straight line is blocked (11 §6
 * puts heavy work in systems); cache the path in the brain if profiling shows the cost.
 */
export class AStarPathfinder {
  private readonly cost: Uint32Array;
  private readonly from: Int32Array;
  private readonly stamp: Uint32Array;
  private readonly heap: CellHeap;
  private readonly path: Int32Array;
  private readonly exits: CourtExitField;
  private search = 0;
  private foundCost = -1;
  /** The cell the search under way heads for; -1 in an `exitWaypoint` search, which has none. */
  private goalCell = -1;
  private goalCol = 0;
  private goalRow = 0;

  /**
   * @param grid - The walkability grid every search runs over.
   * @param limits - How many cells a search may settle and how far it snaps a blocked end.
   */
  public constructor(
    private readonly grid: WorldMap,
    private readonly limits: AStarLimits,
  ) {
    const cells = grid.cols * grid.rows;
    this.cost = new Uint32Array(cells);
    this.from = new Int32Array(cells);
    this.stamp = new Uint32Array(cells);
    this.heap = new CellHeap(cells, (a, b) => this.isBefore(a, b));
    this.path = new Int32Array(cells);
    this.exits = new CourtExitField(grid, (cell, out) => {
      this.searchExit(cell, out);
    });
  }

  /**
   * The cost of the last search's path, in step units (10 straight, 14 diagonal); -1 for none. An
   * `exitWaypoint` answer the exit field kept from an earlier search leaves it unchanged.
   */
  public get lastCost(): number {
    return this.foundCost;
  }

  /**
   * Writes into `out` where a walker at `start` should head next to reach `goal`, and returns
   * whether there is a way. The goal itself when the straight line to it is clear.
   */
  public waypoint(start: Vec2, goal: Vec2, out: MutableVec2): boolean {
    if (this.grid.isLineClear(start.x, start.y, goal.x, goal.y)) {
      out.x = goal.x;
      out.y = goal.y;
      return true;
    }
    const startCell = this.openCellNear(start);
    const goalCell = this.openCellNear(goal);
    if (startCell === -1 || goalCell === -1 || this.find(startCell, goalCell) === -1) {
      return false;
    }
    this.pull(start, goal, goalCell, out);
    return true;
  }

  /**
   * Writes into `out` where a walker standing on blocked ground inside a court (or on a wall cell
   * beside one) should head next to leave it by the nearest doorway: the farthest cell of the way
   * through court cells to open ground it can walk to in a straight line, or the first one (DEC-217
   * (15)). Returns `false`, leaving `out` as it was, on open ground or when no way is found within
   * `maxExpansions`. The answer for each cell is kept until the grid changes (`CourtExitField`).
   */
  public exitWaypoint(start: Vec2, out: MutableVec2): boolean {
    return this.exits.waypoint(start, out);
  }

  /**
   * Searches the way out of blocked `cell` into `out`: the next cell of the way, and its open
   * cell when the way is 2 steps long (the only one whose answer depends on where in `cell` the
   * walker stands); -1 for no way within the budget.
   */
  private searchExit(cell: number, out: ExitWay): void {
    const exit = this.find(cell, -1);
    let next = exit;
    for (let at = exit; at !== -1 && at !== cell; at = this.from[at] ?? -1) {
      next = at;
    }
    const isTwoSteps = exit !== -1 && this.from[exit] === next && next !== exit;
    out.next = next;
    out.end = isTwoSteps ? exit : next;
  }

  /**
   * An open cell near `point`: the nearest on the first ring (by grid steps) that has one, within
   * `snapCells`, lower index on a tie; -1 when there is none.
   */
  private openCellNear(point: Vec2): number {
    const cell = this.grid.cellAt(point);
    if (cell === null) {
      return -1;
    }
    const { cols } = this.grid;
    for (let ring = 0; ring <= this.limits.snapCells; ring += 1) {
      let best = -1;
      let bestGap = Number.POSITIVE_INFINITY;
      for (let row = cell.row - ring; row <= cell.row + ring; row += 1) {
        for (let col = cell.col - ring; col <= cell.col + ring; col += 1) {
          const isOnRing = Math.max(Math.abs(row - cell.row), Math.abs(col - cell.col)) === ring;
          const gap = (row - cell.row) ** 2 + (col - cell.col) ** 2;
          // Rows and columns ascend, so a strict comparison keeps the lower index on a tie.
          if (isOnRing && gap < bestGap && this.isOpen(col, row)) {
            best = row * cols + col;
            bestGap = gap;
          }
        }
      }
      if (best !== -1) {
        return best;
      }
    }
    return -1;
  }

  /**
   * Runs one search from `startCell`, cheapest first, ties by cell index: to `goalCell`, or with
   * `goalCell` -1 (`exitWaypoint`) to the first walkable cell past the start, with no goal to
   * estimate toward. Returns the cell it stopped at; -1 when it found none within the budget.
   */
  private find(startCell: number, goalCell: number): number {
    const { cols } = this.grid;
    this.search += 1;
    this.foundCost = -1;
    this.goalCell = goalCell;
    this.goalCol = goalCell % cols;
    this.goalRow = (goalCell - this.goalCol) / cols;
    this.heap.clear();
    this.reach(startCell, 0, -1);
    for (
      let expanded = 0;
      expanded < this.limits.maxExpansions && this.heap.size > 0;
      expanded += 1
    ) {
      const cell = this.heap.pop();
      if (this.isEnd(cell, startCell)) {
        this.foundCost = this.cost[cell] ?? -1;
        return cell;
      }
      this.expand(cell);
    }
    return -1;
  }

  /** Whether the search under way stops at `cell`: its goal, or else open ground past the start. */
  private isEnd(cell: number, startCell: number): boolean {
    if (this.goalCell !== -1) {
      return cell === this.goalCell;
    }
    const col = cell % this.grid.cols;
    return cell !== startCell && this.grid.isWalkable(col, (cell - col) / this.grid.cols);
  }

  /** Whether a search may step on the cell: walkable, or court ground (`WorldMap.isCourt`). */
  private isOpen(col: number, row: number): boolean {
    return this.grid.isWalkable(col, row) || this.grid.isCourt(col, row);
  }

  /** Relaxes the open neighbours of `cell`; diagonals never cut a corner. */
  private expand(cell: number): void {
    const { cols } = this.grid;
    const col = cell % cols;
    const row = (cell - col) / cols;
    const here = this.cost[cell] ?? 0;
    for (let step = 0; step < DIRECTION_COLS.length; step += 1) {
      const nextCol = col + (DIRECTION_COLS[step] ?? 0);
      const nextRow = row + (DIRECTION_ROWS[step] ?? 0);
      const isCornerCut = step >= 4 && (!this.isOpen(nextCol, row) || !this.isOpen(col, nextRow));
      if (!this.isOpen(nextCol, nextRow) || isCornerCut) {
        continue;
      }
      const next = nextRow * cols + nextCol;
      const reach = here + (step < 4 ? STRAIGHT_COST : DIAGONAL_COST);
      if (this.stamp[next] !== this.search || reach < (this.cost[next] ?? 0)) {
        this.reach(next, reach, cell);
      }
    }
  }

  private reach(cell: number, cost: number, previous: number): void {
    this.stamp[cell] = this.search;
    this.cost[cell] = cost;
    this.from[cell] = previous;
    this.heap.push(cell);
  }

  /**
   * Writes the farthest cell of the path, walking forward from the start, that the walker can
   * still see in a straight line (at least the first, its way out of blocked ground); the goal
   * itself when the path ends in sight, or when it ends in the walker's own cell. A path that
   * starts on the walker's own cell counts from the cell after it: from blocked ground (a walker
   * on court ground) no line is clear, and a next cell on court ground is never in sight, so
   * heading for the own cell's centre would hold the walker there.
   */
  private pull(start: Vec2, goal: Vec2, goalCell: number, out: MutableVec2): void {
    const { cols, cellSize } = this.grid;
    let length = 0;
    for (let cell = goalCell; cell !== -1; cell = this.from[cell] ?? -1) {
      this.path[length] = cell;
      length += 1;
    }
    out.x = goal.x;
    out.y = goal.y;
    // `path` runs goal first; walk it from the start's end and stop at the first cell out of sight.
    const own = this.grid.cellAt(start);
    const isOwnFirst = own !== null && this.path[length - 1] === own.row * cols + own.col;
    if (isOwnFirst && length === 1) return;
    const first = isOwnFirst ? length - 2 : length - 1;
    for (let at = first; at >= 0; at -= 1) {
      const cell = this.path[at] ?? 0;
      const col = cell % cols;
      const x = (col + 0.5) * cellSize;
      const y = ((cell - col) / cols + 0.5) * cellSize;
      const isFirst = at === first;
      if (!isFirst && !this.grid.isLineClear(start.x, start.y, x, y)) {
        return;
      }
      // The first cell is always taken: a neighbour of the own cell, or the way out of blocked ground.
      out.x = x;
      out.y = y;
    }
    if (this.grid.isLineClear(start.x, start.y, goal.x, goal.y)) {
      out.x = goal.x;
      out.y = goal.y;
    }
  }

  /** Estimated total cost through `cell`, then the cell index (11 §5: ties never depend on order). */
  private isBefore(a: number, b: number): boolean {
    const totalA = (this.cost[a] ?? 0) + this.heuristic(a);
    const totalB = (this.cost[b] ?? 0) + this.heuristic(b);
    return totalA < totalB || (totalA === totalB && a < b);
  }

  /**
   * Octile distance to the goal in step-cost units, never more than the true cost; 0 in an
   * `exitWaypoint` search, which has no goal.
   */
  private heuristic(cell: number): number {
    if (this.goalCell === -1) {
      return 0;
    }
    const { cols } = this.grid;
    const col = cell % cols;
    const dx = Math.abs(col - this.goalCol);
    const dy = Math.abs((cell - col) / cols - this.goalRow);
    return STRAIGHT_COST * Math.max(dx, dy) + (DIAGONAL_COST - STRAIGHT_COST) * Math.min(dx, dy);
  }
}
