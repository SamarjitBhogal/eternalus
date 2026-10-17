/**
 * A uniform grid over the world for neighbour queries (architecture 10 §5). Callers insert item
 * indexes with their positions once per tick, then ask for the items in the cells a circle
 * touches; the caller checks the exact distance. Typed-array linked lists keep inserts and queries
 * free of allocation; the visiting order depends only on positions and insert order, never on
 * hashing, so it is deterministic.
 */
export class SpatialHash {
  private readonly columns: number;
  private readonly rows: number;
  private readonly heads: Int32Array;
  private next: Int32Array;

  /**
   * @param width - World width in world units.
   * @param height - World height in world units.
   * @param cellSize - Side of one square cell; at least the largest query radius keeps a query
   *   to the 3 × 3 cells around a point.
   * @throws RangeError when a size is not a positive finite number.
   */
  public constructor(
    width: number,
    height: number,
    private readonly cellSize: number,
  ) {
    for (const [name, value] of [
      ['width', width],
      ['height', height],
      ['cellSize', cellSize],
    ] as const) {
      if (!(value > 0) || !Number.isFinite(value)) {
        throw new RangeError(
          `SpatialHash ${name} must be a positive number, got ${String(value)}.`,
        );
      }
    }
    this.columns = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.heads = new Int32Array(this.columns * this.rows).fill(-1);
    this.next = new Int32Array(0);
  }

  /** Empties the grid; call before re-inserting this tick's items. */
  public clear(): void {
    this.heads.fill(-1);
  }

  /**
   * Adds item `index` (a whole number >= 0) at `(x, y)`. Points outside the world go to the
   * nearest edge cell.
   */
  public insert(index: number, x: number, y: number): void {
    if (index >= this.next.length) {
      const grown = new Int32Array(Math.max(index + 1, this.next.length * 2));
      grown.set(this.next);
      this.next = grown;
    }
    const cell = this.cellAt(x, y);
    this.next[index] = this.heads[cell] ?? -1;
    this.heads[cell] = index;
  }

  /** Visits every item in the cells the circle at `(x, y)` with `radius` touches. */
  public forEachNear(x: number, y: number, radius: number, visit: (index: number) => void): void {
    const firstColumn = this.column(x - radius);
    const lastColumn = this.column(x + radius);
    const firstRow = this.row(y - radius);
    const lastRow = this.row(y + radius);
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        let item = this.heads[row * this.columns + column] ?? -1;
        while (item !== -1) {
          visit(item);
          item = this.next[item] ?? -1;
        }
      }
    }
  }

  private cellAt(x: number, y: number): number {
    return this.row(y) * this.columns + this.column(x);
  }

  private column(x: number): number {
    return Math.min(this.columns - 1, Math.max(0, Math.floor(x / this.cellSize)));
  }

  private row(y: number): number {
    return Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));
  }
}
