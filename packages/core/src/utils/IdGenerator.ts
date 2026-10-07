/**
 * Hands out ids from a counter, so the same sequence of requests yields the same ids in every run
 * (never random, never time-based). Ids are never reused.
 */
export class IdGenerator {
  /** @param lastIssued - The last id already handed out; the next call returns `lastIssued + 1`. */
  public constructor(private lastIssued = 0) {
    if (!Number.isInteger(lastIssued) || lastIssued < 0) {
      throw new RangeError(
        `IdGenerator start must be a whole number >= 0, got ${String(lastIssued)}.`,
      );
    }
  }

  /** The next id: 1, 2, 3, ... by default. */
  public next(): number {
    this.lastIssued += 1;
    return this.lastIssued;
  }
}
