/**
 * A uniform grid over the world for neighbour queries (architecture 10 §5). `rebuild` buckets
 * every point by counting sort into dense typed arrays (Muller's layout); `queryCircle` returns the
 * indexes of the points within a circle, ascending, so results never depend on the grid layout.
 * Allocates only when the point count outgrows its buffers.
 *
 * @remarks ponytail: points only, no radii (`rebuild(positions, radii, count)` in 10 §5) and no
 * `queryRect`; add them when a unit's size or a box query matters to a caller.
 */
export class SpatialHash {
  private readonly columns: number;
  private readonly rows: number;
  /** `cellStart[c]` … `cellStart[c + 1]` are cell `c`'s slots in `entries`. */
  private readonly cellStart: Int32Array;
  /** Scratch for `rebuild`: the next free slot of each cell. */
  private readonly cursor: Int32Array;
  private entries = new Int32Array(0);
  private cellOf = new Int32Array(0);
  private positions: Float64Array = new Float64Array(0);

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
    this.cellStart = new Int32Array(this.columns * this.rows + 1);
    this.cursor = new Int32Array(this.columns * this.rows);
  }

  /**
   * Replaces the contents with `count` points, point `i` at `(positions[2i], positions[2i + 1])`.
   * Points outside the world go to the nearest edge cell.
   */
  public rebuild(positions: Float64Array, count: number): void {
    if (this.entries.length < count) {
      this.entries = new Int32Array(count);
      this.cellOf = new Int32Array(count);
    }
    this.positions = positions;
    this.cellStart.fill(0);
    for (let index = 0; index < count; index += 1) {
      const cell = this.cellAt(positions[2 * index] ?? 0, positions[2 * index + 1] ?? 0);
      this.cellOf[index] = cell;
      this.cellStart[cell + 1] = (this.cellStart[cell + 1] ?? 0) + 1;
    }
    for (let cell = 1; cell < this.cellStart.length; cell += 1) {
      this.cellStart[cell] = (this.cellStart[cell] ?? 0) + (this.cellStart[cell - 1] ?? 0);
    }
    this.cursor.set(this.cellStart.subarray(0, this.cursor.length));
    // Ascending index, so every cell lists its points in ascending order.
    for (let index = 0; index < count; index += 1) {
      const cell = this.cellOf[index] ?? 0;
      const slot = this.cursor[cell] ?? 0;
      this.entries[slot] = index;
      this.cursor[cell] = slot + 1;
    }
  }

  /**
   * Writes the indexes of the points within `radius` of `(x, y)` into `out`, ascending, and
   * returns how many it wrote; points past `out.length` are dropped, so size `out` to the point
   * count.
   */
  public queryCircle(x: number, y: number, radius: number, out: Int32Array): number {
    const firstColumn = this.column(x - radius);
    const lastColumn = this.column(x + radius);
    const firstRow = this.row(y - radius);
    const lastRow = this.row(y + radius);
    const reach = radius * radius;
    let found = 0;
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const cell = row * this.columns + column;
        const end = this.cellStart[cell + 1] ?? 0;
        for (let slot = this.cellStart[cell] ?? 0; slot < end && found < out.length; slot += 1) {
          const index = this.entries[slot] ?? 0;
          const dx = (this.positions[2 * index] ?? 0) - x;
          const dy = (this.positions[2 * index + 1] ?? 0) - y;
          if (dx * dx + dy * dy <= reach) {
            out[found] = index;
            found += 1;
          }
        }
      }
    }
    // Insertion sort in place: each cell is already ascending, so the merge is nearly sorted.
    for (let at = 1; at < found; at += 1) {
      const value = out[at] ?? 0;
      let to = at - 1;
      while (to >= 0 && (out[to] ?? 0) > value) {
        out[to + 1] = out[to] ?? 0;
        to -= 1;
      }
      out[to + 1] = value;
    }
    return found;
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
