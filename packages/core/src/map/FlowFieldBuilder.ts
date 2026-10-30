import {
  DIAGONAL_COST,
  DIRECTION_COLS,
  DIRECTION_PREFERENCE,
  DIRECTION_ROWS,
  NO_DIRECTION,
  REVERSE_DIRECTION,
  STRAIGHT_COST,
  UNREACHED,
} from './FlowField.constants';
import { CellHeap } from './CellHeap';
import type { FlowField } from './FlowField';
import type { WorldMap } from './WorldMap';

/**
 * Builds flow fields one at a time, a budget of cells per call (architecture 06 §6: time-sliced
 * rebuild). A Dijkstra flood fill from the field's goal over the open corridor cells, eight
 * neighbours with octile costs and no corner cutting, ordered by cost then cell index. A cell's
 * direction is chosen when it settles, among the already settled neighbours it is exactly
 * downhill of, in its team's preference order, so the result never depends on the heap order.
 * Blocked corridor cells beside open ground point out of it (`pointWallsOut`). It works in its
 * own buffers and swaps them into the field when the fill completes, so the old field serves
 * until then. Allocation-free after construction.
 *
 * @remarks ponytail: `begin` resets whole-grid buffers outside the cell budget (cheap at today's
 * ~58k cells; reset only the previous field's corridor cells if grids grow), and a cost that would
 * pass `UNREACHED` (0xffff) is never relaxed, so a corridor longer than ~6,500 straight cells
 * silently trims its far end (widen the field to `Uint32Array` if maps grow that large).
 */
export class FlowFieldBuilder {
  private integration: Uint16Array;
  private direction: Int8Array;
  /** The cells waiting to settle, cheapest first. */
  private readonly heap: CellHeap;
  private field: FlowField | null = null;

  /** @param grid - The grid every field this builder fills routes over. */
  public constructor(private readonly grid: WorldMap) {
    const cells = grid.cols * grid.rows;
    this.integration = new Uint16Array(cells);
    this.direction = new Int8Array(cells);
    this.heap = new CellHeap(cells, (a, b) => this.isBefore(a, b));
  }

  /** Whether a fill is in progress. */
  public get isBusy(): boolean {
    return this.field !== null;
  }

  /** Starts filling `field` from scratch, abandoning any fill in progress. */
  public begin(field: FlowField): void {
    this.integration.fill(UNREACHED);
    this.direction.fill(NO_DIRECTION);
    this.heap.clear();
    this.field = field;
    if (field.isOpen(field.goal)) {
      this.integration[field.goal] = 0;
      this.heap.push(field.goal);
    }
  }

  /**
   * Settles up to `budget` cells of the fill in progress and returns how many it settled. When
   * none are left the finished arrays replace the field's and the builder is idle again.
   */
  public step(budget: number): number {
    const field = this.field;
    if (field === null) {
      return 0;
    }
    let settled = 0;
    while (settled < budget && this.heap.size > 0) {
      this.settle(field, this.heap.pop());
      settled += 1;
    }
    if (this.heap.size === 0) {
      const { integration, direction } = field;
      field.adopt(this.integration, this.direction);
      this.integration = integration;
      this.direction = direction;
      this.field = null;
    }
    return settled;
  }

  /** Picks `cell`'s direction, then relaxes its open neighbours. */
  private settle(field: FlowField, cell: number): void {
    const { cols } = this.grid;
    const col = cell % cols;
    const row = (cell - col) / cols;
    const cost = this.integration[cell] ?? UNREACHED;
    for (const step of DIRECTION_PREFERENCE[field.team]) {
      const next = this.neighbour(field, col, row, step);
      const stepCost = step < 4 ? STRAIGHT_COST : DIAGONAL_COST;
      if (next !== -1 && (this.integration[next] ?? UNREACHED) + stepCost === cost) {
        this.direction[cell] = step;
        break;
      }
    }
    for (let step = 0; step < DIRECTION_COLS.length; step += 1) {
      const next = this.neighbour(field, col, row, step);
      const reach = cost + (step < 4 ? STRAIGHT_COST : DIAGONAL_COST);
      if (next !== -1 && reach < (this.integration[next] ?? UNREACHED)) {
        this.integration[next] = reach;
        this.heap.push(next);
      }
    }
    this.pointWallsOut(field, cell, col, row);
  }

  /**
   * Points each blocked corridor cell next to `cell` back at it, unless it already points at a
   * cheaper open cell, or an equally cheap one its team prefers. Cells settle cheapest first, so
   * a wall cell ends up leading to its cheapest open neighbour, and a unit pushed into a wall is
   * led out and on (a stand-in for the wall-avoidance term of architecture 10 §9).
   *
   * ponytail: a stand-in; the wall-avoidance term arrives with `CollisionSystem` (10 §8–§9), and
   * walls then stop pointing anywhere.
   */
  private pointWallsOut(field: FlowField, cell: number, col: number, row: number): void {
    const { cols, rows } = this.grid;
    const preference: readonly number[] = DIRECTION_PREFERENCE[field.team];
    for (let step = 0; step < DIRECTION_COLS.length; step += 1) {
      const wallCol = col + (DIRECTION_COLS[step] ?? 0);
      const wallRow = row + (DIRECTION_ROWS[step] ?? 0);
      const wall = wallRow * cols + wallCol;
      const isWall =
        wallCol >= 0 &&
        wallRow >= 0 &&
        wallCol < cols &&
        wallRow < rows &&
        field.mask[wall] === 1 &&
        !field.isOpen(wall);
      if (!isWall) {
        continue;
      }
      const back = REVERSE_DIRECTION[step] ?? NO_DIRECTION;
      const current = this.direction[wall] ?? NO_DIRECTION;
      const target = wall + (DIRECTION_ROWS[current] ?? 0) * cols + (DIRECTION_COLS[current] ?? 0);
      const isTie =
        current !== NO_DIRECTION &&
        this.integration[target] === this.integration[cell] &&
        preference.indexOf(back) < preference.indexOf(current);
      if (current === NO_DIRECTION || isTie) {
        this.direction[wall] = back;
      }
    }
  }

  /** The open neighbour of `(col, row)` in direction `step`, or -1; diagonals never cut a corner. */
  private neighbour(field: FlowField, col: number, row: number, step: number): number {
    const nextCol = col + (DIRECTION_COLS[step] ?? 0);
    const nextRow = row + (DIRECTION_ROWS[step] ?? 0);
    const { cols, rows } = this.grid;
    if (nextCol < 0 || nextRow < 0 || nextCol >= cols || nextRow >= rows) {
      return -1;
    }
    const next = nextRow * cols + nextCol;
    const isCornerCut =
      step >= 4 && (!field.isOpen(row * cols + nextCol) || !field.isOpen(nextRow * cols + col));
    return field.isOpen(next) && !isCornerCut ? next : -1;
  }

  private isBefore(a: number, b: number): boolean {
    const costA = this.integration[a] ?? UNREACHED;
    const costB = this.integration[b] ?? UNREACHED;
    return costA < costB || (costA === costB && a < b);
  }
}
