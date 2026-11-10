import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { AStarLimits } from './AStarPathfinder.types';
import { CellHeap } from './CellHeap';
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
 * @remarks ponytail: a bot searches again on each decision whose straight line is blocked (11 §6
 * puts heavy work in systems); cache the path in the brain if profiling shows the cost.
 */
export class AStarPathfinder {
  private readonly cost: Uint32Array;
  private readonly from: Int32Array;
  private readonly stamp: Uint32Array;
  private readonly heap: CellHeap;
  private readonly path: Int32Array;
  private search = 0;
  private foundCost = -1;
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
  }

  /** The cost of the last path found, in step units (10 straight, 14 diagonal); -1 for none. */
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
    if (startCell === -1 || goalCell === -1 || !this.find(startCell, goalCell)) {
      return false;
    }
    this.pull(start, goal, goalCell, out);
    return true;
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
          if (isOnRing && gap < bestGap && this.grid.isWalkable(col, row)) {
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

  /** Runs the search; `true` when it reached `goalCell` within the budget. */
  private find(startCell: number, goalCell: number): boolean {
    const { cols } = this.grid;
    this.search += 1;
    this.foundCost = -1;
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
      if (cell === goalCell) {
        this.foundCost = this.cost[cell] ?? -1;
        return true;
      }
      this.expand(cell);
    }
    return false;
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
      const isCornerCut =
        step >= 4 && (!this.grid.isWalkable(nextCol, row) || !this.grid.isWalkable(col, nextRow));
      if (!this.grid.isWalkable(nextCol, nextRow) || isCornerCut) {
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
   * itself when the path ends in sight.
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
    for (let at = length - 1; at >= 0; at -= 1) {
      const cell = this.path[at] ?? 0;
      const col = cell % cols;
      const x = (col + 0.5) * cellSize;
      const y = ((cell - col) / cols + 0.5) * cellSize;
      const isFirst = at === length - 1;
      if (!isFirst && !this.grid.isLineClear(start.x, start.y, x, y)) {
        return;
      }
      // The first cell is always taken: from a blocked start it is the way out.
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

  /** Octile distance to the goal in step-cost units, never more than the true cost. */
  private heuristic(cell: number): number {
    const { cols } = this.grid;
    const col = cell % cols;
    const dx = Math.abs(col - this.goalCol);
    const dy = Math.abs((cell - col) / cols - this.goalRow);
    return STRAIGHT_COST * Math.max(dx, dy) + (DIAGONAL_COST - STRAIGHT_COST) * Math.min(dx, dy);
  }
}
