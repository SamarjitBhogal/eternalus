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
import type { FlowField } from './FlowField';
import type { WorldMap } from './WorldMap';

/**
 * Builds flow fields one at a time, a budget of cells per call (architecture 06 §6: time-sliced
 * rebuild). A Dijkstra flood fill from the field's goal over the open corridor cells, eight
 * neighbours with octile costs and no corner cutting, ordered by cost then cell index. A cell's
 * direction is chosen when it settles, among the already settled neighbours it is exactly
 * downhill of, in its team's preference order, so the result never depends on the heap order.
 * Every blocked corridor cell that open ground can be reached from then points out the shortest
 * way: those beside open ground at it (`pointWallsOut`), each deeper one at a neighbour one cell
 * nearer (`pointInnerWallsOut`), so a horde spawned at a structure's centre walks out (MS-31). It
 * works in its own buffers and swaps them into the field when the fill completes, so the old field
 * serves until then. Allocation-free after construction.
 *
 * @remarks ponytail: `begin` resets whole-grid buffers outside the cell budget (cheap at today's
 * ~58k cells; reset only the previous field's corridor cells if grids grow), and a cost that would
 * pass `UNREACHED` (0xffff) is never relaxed, so a corridor longer than ~6,500 straight cells
 * silently trims its far end (widen the field to `Uint32Array` if maps grow that large).
 */
export class FlowFieldBuilder {
  private integration: Uint16Array;
  private direction: Int8Array;
  /** A binary min-heap of cells, and each cell's position in it (-1 when not queued). */
  private readonly heap: Int32Array;
  private readonly heapSlot: Int32Array;
  private heapSize = 0;
  /** Blocked corridor cells in the order they are reached, and each one's steps from open ground. */
  private readonly walls: Int32Array;
  private readonly wallDepth: Uint16Array;
  private wallCount = 0;
  private wallHead = 0;
  private field: FlowField | null = null;

  /** @param grid - The grid every field this builder fills routes over. */
  public constructor(private readonly grid: WorldMap) {
    const cells = grid.cols * grid.rows;
    this.integration = new Uint16Array(cells);
    this.direction = new Int8Array(cells);
    this.heap = new Int32Array(cells);
    this.heapSlot = new Int32Array(cells);
    this.walls = new Int32Array(cells);
    this.wallDepth = new Uint16Array(cells);
  }

  /** Whether a fill is in progress. */
  public get isBusy(): boolean {
    return this.field !== null;
  }

  /** Starts filling `field` from scratch, abandoning any fill in progress. */
  public begin(field: FlowField): void {
    this.integration.fill(UNREACHED);
    this.direction.fill(NO_DIRECTION);
    this.heapSlot.fill(-1);
    this.heapSize = 0;
    this.wallDepth.fill(UNREACHED);
    this.wallCount = 0;
    this.wallHead = 0;
    this.field = field;
    if (field.isOpen(field.goal)) {
      this.integration[field.goal] = 0;
      this.push(field.goal);
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
    while (settled < budget && this.heapSize > 0) {
      this.settle(field, this.pop());
      settled += 1;
    }
    // The open cells all settled, so every wall beside them is queued: lead the deeper ones out.
    while (settled < budget && this.heapSize === 0 && this.wallHead < this.wallCount) {
      this.pointInnerWallsOut(field, this.walls[this.wallHead] ?? -1);
      this.wallHead += 1;
      settled += 1;
    }
    if (this.heapSize === 0 && this.wallHead === this.wallCount) {
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
        const slot = this.heapSlot[next] ?? -1;
        if (slot === -1) {
          this.push(next);
        } else {
          this.siftUp(slot);
        }
      }
    }
    this.pointWallsOut(field, cell, col, row);
  }

  /**
   * Points each blocked corridor cell next to `cell` back at it, unless it already points at a
   * cheaper open cell, or an equally cheap one its team prefers. Cells settle cheapest first, so
   * a wall cell ends up leading to its cheapest open neighbour, and a unit pushed into a wall is
   * led out and on. Each wall is queued, at depth 0, the first time it is pointed.
   *
   * ponytail: also a stand-in for the wall-avoidance term of architecture 10 §9, which arrives
   * with `CollisionSystem` (10 §8); walls keep pointing out after that, since hordes spawn inside
   * their structure's footprint (MS-31).
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
      if (current === NO_DIRECTION) {
        this.wallDepth[wall] = 0;
        this.walls[this.wallCount] = wall;
        this.wallCount += 1;
      }
      if (current === NO_DIRECTION || isTie) {
        this.direction[wall] = back;
      }
    }
  }

  /**
   * Leads the queued wall `wall` out, then queues its blocked corridor neighbours not yet reached,
   * one cell deeper. The queue is first in, first out, so depths are the fewest steps (8-way) to
   * open ground. A deeper wall points at the neighbour one step shallower its team prefers, which
   * the depths alone decide, so the result never depends on the queue order (Light and Dark stay
   * mirror images, 06 §2).
   */
  private pointInnerWallsOut(field: FlowField, wall: number): void {
    const { cols } = this.grid;
    const col = wall % cols;
    const row = (wall - col) / cols;
    const depth = this.wallDepth[wall] ?? 0;
    if (depth > 0) {
      for (const step of DIRECTION_PREFERENCE[field.team]) {
        if (this.wallDepth[this.cellOf(col, row, step)] === depth - 1) {
          this.direction[wall] = step;
          break;
        }
      }
    }
    for (let step = 0; step < DIRECTION_COLS.length; step += 1) {
      const next = this.cellOf(col, row, step);
      const isNewWall =
        next !== -1 &&
        field.mask[next] === 1 &&
        !field.isOpen(next) &&
        this.wallDepth[next] === UNREACHED;
      if (isNewWall) {
        this.wallDepth[next] = depth + 1;
        this.walls[this.wallCount] = next;
        this.wallCount += 1;
      }
    }
  }

  /** The cell next to `(col, row)` in direction `step`, or -1 off the grid. */
  private cellOf(col: number, row: number, step: number): number {
    const nextCol = col + (DIRECTION_COLS[step] ?? 0);
    const nextRow = row + (DIRECTION_ROWS[step] ?? 0);
    const { cols, rows } = this.grid;
    const isInside = nextCol >= 0 && nextRow >= 0 && nextCol < cols && nextRow < rows;
    return isInside ? nextRow * cols + nextCol : -1;
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

  private push(cell: number): void {
    this.heap[this.heapSize] = cell;
    this.heapSlot[cell] = this.heapSize;
    this.heapSize += 1;
    this.siftUp(this.heapSize - 1);
  }

  private pop(): number {
    const top = this.heap[0] ?? -1;
    this.heapSize -= 1;
    this.heapSlot[top] = -1;
    if (this.heapSize > 0) {
      this.place(this.heap[this.heapSize] ?? -1, 0);
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(start: number): void {
    let slot = start;
    const cell = this.heap[slot] ?? -1;
    while (slot > 0) {
      const parent = (slot - 1) >> 1;
      const above = this.heap[parent] ?? -1;
      if (!this.isBefore(cell, above)) {
        break;
      }
      this.place(above, slot);
      slot = parent;
    }
    this.place(cell, slot);
  }

  private siftDown(start: number): void {
    let slot = start;
    const cell = this.heap[slot] ?? -1;
    for (;;) {
      const left = slot * 2 + 1;
      if (left >= this.heapSize) {
        break;
      }
      const right = left + 1;
      const leftCell = this.heap[left] ?? -1;
      const rightCell = this.heap[right] ?? -1;
      const child = right < this.heapSize && this.isBefore(rightCell, leftCell) ? right : left;
      const childCell = child === right ? rightCell : leftCell;
      if (!this.isBefore(childCell, cell)) {
        break;
      }
      this.place(childCell, slot);
      slot = child;
    }
    this.place(cell, slot);
  }

  private place(cell: number, slot: number): void {
    this.heap[slot] = cell;
    this.heapSlot[cell] = slot;
  }
}
