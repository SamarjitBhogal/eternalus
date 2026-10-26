/**
 * A uniform grid over the world for neighbour queries (architecture 10 §5). `rebuild` sorts the
 * points by cell, then by index, into one dense typed array, so its cost follows the point count,
 * not the size of the world; `queryCircle` finds each covered cell's run by binary search and
 * returns the indexes of the points within the circle, ascending, so results never depend on the
 * grid layout. O(n log n) per rebuild; allocates a buffer only when the point count outgrows it,
 * and one view object per rebuild. A point at a NaN position is never found.
 *
 * @remarks ponytail: points only, no radii (`rebuild(positions, radii, count)` in 10 §5) and no
 * `queryRect`; add them when a unit's size or a box query matters to a caller.
 */
export class SpatialHash {
  private readonly columns: number;
  private readonly rows: number;
  /** Every point as `cell × stride + index`, ascending: cell runs, each in index order. */
  private keys = new Float64Array(0);
  private count = 0;
  /** One more than the largest point index, so `key % stride` is the index. */
  private stride = 1;
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
  }

  /**
   * Replaces the contents with `count` points, point `i` at `(positions[2i], positions[2i + 1])`.
   * Points outside the world go to the nearest edge cell.
   *
   * @throws RangeError when cells × points passes `Number.MAX_SAFE_INTEGER`, where the sort keys
   *   would stop being exact.
   */
  public rebuild(positions: Float64Array, count: number): void {
    if (this.columns * this.rows * Math.max(1, count) > Number.MAX_SAFE_INTEGER) {
      throw new RangeError(
        `SpatialHash cannot key ${String(count)} points over ${String(this.columns * this.rows)} cells exactly.`,
      );
    }
    if (this.keys.length < count) {
      this.keys = new Float64Array(count);
    }
    this.positions = positions;
    this.count = count;
    this.stride = Math.max(1, count);
    for (let index = 0; index < count; index += 1) {
      const cell = this.cellAt(positions[2 * index] ?? 0, positions[2 * index + 1] ?? 0);
      this.keys[index] = cell * this.stride + index;
    }
    // Keys are whole numbers well under 2^53, so the numeric sort is exact and deterministic.
    this.keys.subarray(0, count).sort();
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
        const end = (cell + 1) * this.stride;
        for (
          let slot = this.firstSlot(cell * this.stride);
          slot < this.count && (this.keys[slot] ?? end) < end && found < out.length;
          slot += 1
        ) {
          const index = (this.keys[slot] ?? 0) - cell * this.stride;
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

  /** The first slot whose key is at least `key` (binary search over the sorted keys). */
  private firstSlot(key: number): number {
    let low = 0;
    let high = this.count;
    while (low < high) {
      const middle = (low + high) >> 1;
      if ((this.keys[middle] ?? key) < key) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low;
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
