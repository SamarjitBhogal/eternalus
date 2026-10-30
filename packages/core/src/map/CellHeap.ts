/**
 * A binary min-heap of grid cell indexes that knows where each cell sits, so a cell whose key
 * dropped moves up in place (Dijkstra and A\*, architecture 06 §6, 10 §9). The order comes from
 * the owner's `isBefore`, which breaks ties by cell index, so pops never depend on push order.
 * Allocation-free after construction.
 */
export class CellHeap {
  private readonly cells: Int32Array;
  private readonly slots: Int32Array;
  private count = 0;

  /**
   * @param capacity - The grid's cell count.
   * @param isBefore - Whether cell `a` pops before cell `b`.
   */
  public constructor(
    capacity: number,
    private readonly isBefore: (a: number, b: number) => boolean,
  ) {
    this.cells = new Int32Array(capacity);
    this.slots = new Int32Array(capacity).fill(-1);
  }

  /** How many cells are queued. */
  public get size(): number {
    return this.count;
  }

  /** Empties the heap, touching only the cells still queued. */
  public clear(): void {
    for (let slot = 0; slot < this.count; slot += 1) {
      this.slots[this.cells[slot] ?? 0] = -1;
    }
    this.count = 0;
  }

  /** Queues `cell`, or moves it up when it is already queued and its key dropped. */
  public push(cell: number): void {
    const slot = this.slots[cell] ?? -1;
    if (slot !== -1) {
      this.siftUp(slot);
      return;
    }
    this.place(cell, this.count);
    this.count += 1;
    this.siftUp(this.count - 1);
  }

  /** Removes and returns the first cell; -1 when empty. */
  public pop(): number {
    if (this.count === 0) {
      return -1;
    }
    const top = this.cells[0] ?? -1;
    this.count -= 1;
    this.slots[top] = -1;
    if (this.count > 0) {
      this.place(this.cells[this.count] ?? -1, 0);
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(start: number): void {
    let slot = start;
    const cell = this.cells[slot] ?? -1;
    while (slot > 0) {
      const parent = (slot - 1) >> 1;
      const above = this.cells[parent] ?? -1;
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
    const cell = this.cells[slot] ?? -1;
    for (;;) {
      const left = slot * 2 + 1;
      if (left >= this.count) {
        break;
      }
      const right = left + 1;
      const leftCell = this.cells[left] ?? -1;
      const rightCell = this.cells[right] ?? -1;
      const child = right < this.count && this.isBefore(rightCell, leftCell) ? right : left;
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
    this.cells[slot] = cell;
    this.slots[cell] = slot;
  }
}
