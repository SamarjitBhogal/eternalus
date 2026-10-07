/**
 * A fixed-capacity list that keeps the newest `capacity` items, overwriting the oldest. Used for
 * the recent-events and recent-commands context of diagnostic reports.
 */
export class RingBuffer<T> {
  private readonly items: T[] = [];
  private next = 0;

  /** @param capacity - Maximum number of items kept; a whole number >= 1. */
  public constructor(public readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `RingBuffer capacity must be a whole number >= 1, got ${String(capacity)}.`,
      );
    }
  }

  /** Number of items held, at most `capacity`. */
  public get size(): number {
    return this.items.length;
  }

  /** Adds `item`, dropping the oldest item when full. */
  public push(item: T): void {
    if (this.items.length < this.capacity) {
      this.items.push(item);
    } else {
      this.items[this.next] = item;
    }
    this.next = (this.next + 1) % this.capacity;
  }

  /** The items held, oldest first, as a new array. */
  public toArray(): T[] {
    return [...this.items.slice(this.next), ...this.items.slice(0, this.next)];
  }
}
