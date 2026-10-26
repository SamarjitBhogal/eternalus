import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
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
 * without searching. A search stops after `maxExpansions` cells and answers "no way" rather than
 * flood the whole grid. Allocation-free after construction: a search stamps the cells it touches.
 */
export class AStarPathfinder {
  private readonly cost: Uint32Array;
  private readonly from: Int32Array;
  private readonly stamp: Uint32Array;
  private readonly heap: CellHeap;
  private search = 0;
  private goalCol = 0;
  private goalRow = 0;

  /**
   * @param grid - The walkability grid every search runs over.
   * @param maxExpansions - At most this many cells settle in one search.
   */
  public constructor(
    private readonly grid: WorldMap,
    private readonly maxExpansions: number,
  ) {
    const cells = grid.cols * grid.rows;
    this.cost = new Uint32Array(cells);
    this.from = new Int32Array(cells);
    this.stamp = new Uint32Array(cells);
    this.heap = new CellHeap(cells, (a, b) => this.isBefore(a, b));
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
    const first = this.grid.cellAt(start);
    const last = this.grid.cellAt(goal);
    if (first === null || last === null || !this.grid.isWalkable(last.col, last.row)) {
      return false;
    }
    const { cols } = this.grid;
    const goalCell = last.row * cols + last.col;
    if (!this.find(first.row * cols + first.col, goalCell)) {
      return false;
    }
    this.pull(start, goal, goalCell, out);
    return true;
  }

  /** Runs the search; `true` when it reached `goalCell` within the budget. */
  private find(startCell: number, goalCell: number): boolean {
    const { cols } = this.grid;
    this.search += 1;
    this.goalCol = goalCell % cols;
    this.goalRow = (goalCell - this.goalCol) / cols;
    this.heap.clear();
    this.reach(startCell, 0, -1);
    for (let expanded = 0; expanded < this.maxExpansions && this.heap.size > 0; expanded += 1) {
      const cell = this.heap.pop();
      if (cell === goalCell) {
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

  /** The farthest path cell (from the goal back) the walker can reach in a straight line. */
  private pull(start: Vec2, goal: Vec2, goalCell: number, out: MutableVec2): void {
    const { cols, cellSize } = this.grid;
    out.x = goal.x;
    out.y = goal.y;
    for (let cell = goalCell; cell !== -1; cell = this.from[cell] ?? -1) {
      const col = cell % cols;
      const x = (col + 0.5) * cellSize;
      const y = ((cell - col) / cols + 0.5) * cellSize;
      if (this.grid.isLineClear(start.x, start.y, x, y)) {
        out.x = x;
        out.y = y;
        return;
      }
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
