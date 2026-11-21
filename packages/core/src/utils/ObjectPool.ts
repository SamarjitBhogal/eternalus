/**
 * A fixed set of reusable objects (Object Pool, research §6), so hot paths do not allocate. All
 * `capacity` objects are made up front. `reset` runs on `acquire` (the caller gets a clean
 * object) and on `release` (a pooled object keeps no references alive). Event payloads are not
 * pooled (DEC-94): `GameEvents.emit` keeps them in the recent-events buffer and handlers may keep
 * them after `emit`.
 */
export class ObjectPool<T extends object> {
  private readonly free: T[] = [];
  private readonly freeSet = new Set<T>();
  private readonly owned = new Set<T>();

  /**
   * @param capacity - How many objects the pool holds; a whole number >= 1.
   * @param create - Makes one object; called `capacity` times by the constructor.
   * @param reset - Puts every field back to its empty value and nulls every reference.
   */
  public constructor(
    public readonly capacity: number,
    create: () => T,
    private readonly reset: (item: T) => void,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `ObjectPool capacity must be a whole number >= 1, got ${String(capacity)}.`,
      );
    }
    for (let index = 0; index < capacity; index += 1) {
      const item = create();
      this.free.push(item);
      this.freeSet.add(item);
      this.owned.add(item);
    }
  }

  /** How many objects are free to acquire. */
  public get available(): number {
    return this.free.length;
  }

  /**
   * A reset object, or `undefined` when every object is in use: the caller decides whether to skip
   * (particles) or treat it as a sizing bug (projectiles).
   */
  public acquire(): T | undefined {
    const item = this.free.pop();
    if (item === undefined) {
      return undefined;
    }
    this.freeSet.delete(item);
    this.reset(item);
    return item;
  }

  /**
   * Resets `item` and returns it to the pool. Throws on an object this pool did not make (it would
   * grow past `capacity`) and on one that is already free.
   */
  public release(item: T): void {
    if (!this.owned.has(item)) {
      throw new Error('ObjectPool: object does not belong to this pool.');
    }
    if (this.freeSet.has(item)) {
      throw new Error('ObjectPool: object released twice.');
    }
    this.reset(item);
    this.free.push(item);
    this.freeSet.add(item);
  }
}
