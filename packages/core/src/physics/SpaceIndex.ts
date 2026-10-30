import { SpatialHash } from './SpatialHash';

/**
 * The neighbour index the state exposes as `state.space` (architecture 11 §3): a `SpatialHash`
 * over the units' positions plus the id of each index. `SpaceSystem` refills it each tick in store
 * order; it grows its buffers with the crowd and otherwise allocates nothing.
 */
export class SpaceIndex {
  private readonly hash: SpatialHash;
  private ids: string[] = [];
  private readonly indexes = new Map<string, number>();
  private buffer = new Float64Array(0);
  private size = 0;

  /**
   * @param width - World width in world units.
   * @param height - World height in world units.
   * @param cellSize - The grid cell size: at least the most common query radius.
   */
  public constructor(width: number, height: number, cellSize: number) {
    this.hash = new SpatialHash(width, height, cellSize);
  }

  /** How many units the index holds. */
  public get count(): number {
    return this.size;
  }

  /** Unit `i` is at `(positions[2i], positions[2i + 1])`. */
  public get positions(): Float64Array {
    return this.buffer;
  }

  /** Starts a refill for up to `capacity` units; `add` them in store order, then `commit`. */
  public begin(capacity: number): void {
    if (this.buffer.length < 2 * capacity) {
      this.buffer = new Float64Array(2 * Math.max(capacity, this.buffer.length));
    }
    this.size = 0;
    this.indexes.clear();
  }

  /** Adds the unit `id` at `(x, y)`. */
  public add(id: string, x: number, y: number): void {
    this.buffer[2 * this.size] = x;
    this.buffer[2 * this.size + 1] = y;
    this.ids[this.size] = id;
    this.indexes.set(id, this.size);
    this.size += 1;
  }

  /** Finishes a refill: rebuilds the grid over the units added since `begin`. */
  public commit(): void {
    this.ids.length = this.size;
    this.hash.rebuild(this.buffer, this.size);
  }

  /** The id of the unit at `index`. */
  public idAt(index: number): string {
    return this.ids[index] ?? '';
  }

  /** The index of `id`, or `undefined` when the index does not hold it. */
  public indexOf(id: string): number | undefined {
    return this.indexes.get(id);
  }

  /** Writes the indexes within `radius` of `(x, y)` into `out`, ascending; returns the count. */
  public queryCircle(x: number, y: number, radius: number, out: Int32Array): number {
    return this.hash.queryCircle(x, y, radius, out);
  }
}
